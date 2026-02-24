import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from "socket.io-client";

const useSocket = () => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const mountedRef = useRef(true);

  // 🔥 FIX: PERMANENT session ID - kabhi change nahi hoga
  const getSessionId = useCallback(() => {
    let sessionId = localStorage.getItem("matchmate_permanent_session");

    if (!sessionId) {
      sessionId = crypto.randomUUID();
      localStorage.setItem("matchmate_permanent_session", sessionId);
      console.log("🆕 New permanent session created:", sessionId);
    }

    return sessionId;
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    const initializeSocket = () => {
      if (!mountedRef.current) return;

      const sessionId = getSessionId(); // 👈 Permanent session ID

      console.log("🔌 Initializing socket connection...", { sessionId });

      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }

      const s = io(import.meta.env.VITE_SOCKET_URL, {
        transports: ["websocket", "polling"], // polling as fallback
        auth: { sessionId },
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 10000,
        forceNew: true
      });

      socketRef.current = s;

      s.on("connect", () => {
        if (!mountedRef.current) return;
        console.log("✅ Connected:", s.id);
        setIsConnected(true);
        reconnectAttempts.current = 0;

        // 🔥 FIX: Jab bhi connect ho, premium check karo
        const token = localStorage.getItem('premium_token');
        if (token) {
          console.log("🔍 Verifying premium token with server...");
          s.emit('verify_premium', { token, sessionId });
        } else {
          // Sirf session se check karo
          s.emit('check_premium_by_session', { sessionId });
        }
      });

      s.on("disconnect", (reason) => {
        if (!mountedRef.current) return;
        console.log("❌ Disconnected:", reason);
        setIsConnected(false);

        if (reason === "io server disconnect") {
          setTimeout(() => {
            if (mountedRef.current && socketRef.current) {
              socketRef.current.connect();
            }
          }, 1000);
        }
      });

      s.on("connect_error", (error) => {
        if (!mountedRef.current) return;
        console.error("Connection error:", error.message);
        reconnectAttempts.current += 1;

        if (reconnectAttempts.current > 5) {
          console.log("Too many reconnect attempts, reloading page...");
          window.location.reload();
        }
      });

      s.io.on("reconnect_attempt", (attempt) => {
        console.log(`🔄 Reconnect attempt ${attempt}`);
      });

      // 🔥 FIX: Premium verification response
      s.on("premium_verified", ({ expiresAt, restoredToken }) => {
        console.log("✨ Premium verified/restored from server!");
        if (restoredToken) {
          localStorage.setItem('premium_token', restoredToken);
        }
        localStorage.setItem('premium_until', expiresAt.toString());
      });

      s.on("premium_invalid", () => {
        console.log("⚠️ No premium found for this session");
        localStorage.removeItem('premium_token');
        localStorage.removeItem('premium_until');
      });

      if (mountedRef.current) {
        setSocket(s);
      }
    };

    const timer = setTimeout(initializeSocket, 100);

    return () => {
      console.log("🧹 Cleaning up socket connection");
      mountedRef.current = false;
      clearTimeout(timer);

      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }

      setSocket(null);
      setIsConnected(false);
    };
  }, [getSessionId]);

  return { socket, socketRef, isConnected };
};

export default useSocket;
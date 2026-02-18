import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from "socket.io-client";

const useSocket = () => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const mountedRef = useRef(true);

  const getSessionId = useCallback(() => {
    let id = localStorage.getItem("matchmate_session");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("matchmate_session", id);
    }
    return id;
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    const initializeSocket = () => {
      if (!mountedRef.current) return;

      const sessionId = getSessionId();

      console.log("🔌 Initializing socket connection...", { sessionId });

      // Agar already socket hai to pehle cleanup karo
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }

      const s = io(import.meta.env.VITE_SOCKET_URL, {
        transports: ["websocket"],
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
      });

      s.on("disconnect", (reason) => {
        if (!mountedRef.current) return;
        console.log("❌ Disconnected:", reason);
        setIsConnected(false);

        // Agar server ne disconnect kiya to reconnect try karo
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

      if (mountedRef.current) {
        setSocket(s);
      }
    };

    // Small delay to ensure clean mount
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
import { useEffect, useRef, useState } from 'react';
import { io } from "socket.io-client";
import useSession from './useSession';

const useSocket = () => {
  const [socket, setSocket] = useState(null);
  const socketRef = useRef(null);
  const { getSessionId } = useSession();

  useEffect(() => {
    const sessionId = getSessionId();

    const s = io(import.meta.env.VITE_SOCKET_URL, {
      transports: ["websocket"],
      auth: { sessionId },
    });

    socketRef.current = s;
    setSocket(s);

    s.on("connect", () => {
      console.log("✅ Connected:", s.id);
    });

    return () => {
      s.disconnect();
      socketRef.current = null;
    };
  }, [getSessionId]);

  return { socket, socketRef };
};

export default useSocket;
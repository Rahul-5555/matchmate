import { useEffect } from 'react';

const useSocketEvents = (socket, onMatched) => {
  useEffect(() => {
    if (!socket) return;

    const handleMatched = (data) => {
      onMatched(data);
    };

    socket.on("matched", handleMatched);

    return () => {
      socket.off("matched", handleMatched);
    };
  }, [socket, onMatched]);
};

export default useSocketEvents;
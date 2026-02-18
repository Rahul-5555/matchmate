import { useCallback } from 'react';

const useSession = () => {
  const getSessionId = useCallback(() => {
    let id = localStorage.getItem("matchmate_session");

    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("matchmate_session", id);
    }

    return id;
  }, []); // ✅ Add empty dependency array

  return { getSessionId };
};

export default useSession;
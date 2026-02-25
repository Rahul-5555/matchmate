import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary";
import { FullPageLoader } from "./components/LoadingSpinner";
import Toast from "./components/Toast";
import { useToast } from "./hooks/useToast";

import Home from "./pages/Home.jsx";
import CallPage from "./pages/CallPage.jsx";

// Create Toast Context
import { createContext, useContext } from "react";
const ToastContext = createContext();
export const useToastContext = () => useContext(ToastContext);

function AppContent() {
  const [showSplash, setShowSplash] = useState(true);
  const { toast, showToast, hideToast } = useToast();

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 1600);

    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    return (
      <div className="
        min-h-screen flex items-center justify-center
        bg-slate-950 text-white
      ">
        <div className="flex flex-col items-center gap-4 animate-fadeIn">

          <div className="text-3xl font-extrabold tracking-wide">
            ♟ MatchMate
          </div>

          <div className="text-sm text-white/60">
            Connecting anonymously…
          </div>

          <div className="mt-2 flex gap-1">
            <span className="w-2 h-2 bg-white/60 rounded-full animate-bounce [animation-delay:-0.2s]" />
            <span className="w-2 h-2 bg-white/60 rounded-full animate-bounce [animation-delay:-0.1s]" />
            <span className="w-2 h-2 bg-white/60 rounded-full animate-bounce" />
          </div>
        </div>

        <style>
          {`
            @keyframes fadeIn {
              from { opacity: 0; transform: translateY(6px); }
              to { opacity: 1; transform: translateY(0); }
            }
            .animate-fadeIn {
              animation: fadeIn 0.45s ease-out;
            }
          `}
        </style>
      </div>
    );
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={hideToast}
        />
      )}
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/call" element={<CallPage />} />
        </Routes>
      </BrowserRouter>
    </ToastContext.Provider>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

export default App;
import { useEffect, useCallback } from "react";
import { Navigate, useNavigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const navigate = useNavigate();
  const isAuthenticated = localStorage.getItem("cmsAdmin");

  const TIMEOUT_DURATION = 45 * 60 * 1000; 

  const handleLogout = useCallback(() => {
    localStorage.removeItem("cmsAdmin");

    alert("Session expired due to inactivity.");
    
    navigate("/cms/login");
  }, [navigate]);

  useEffect(() => {
    if (!isAuthenticated) return;

    let timeoutId;

    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(handleLogout, TIMEOUT_DURATION);
    };

    const events = [
      'mousedown',
      'mousemove',
      'keydown',
      'scroll',
      'touchstart'
    ];

    events.forEach((event) => {
      window.addEventListener(event, resetTimer);
    });

    // Start the timer immediately upon mount
    resetTimer();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      events.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [isAuthenticated, handleLogout]);

  if (!isAuthenticated) {
    return <Navigate to="/cms/login" replace />;
  }

  return children;
}
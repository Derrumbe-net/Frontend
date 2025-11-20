import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const isAuthenticated = localStorage.getItem("cmsAdmin");

  // If there's no token, go back to login
  if (!isAuthenticated) {
    return <Navigate to="/cms/login" replace />;
  }

  // Otherwise, show the protected page
  return children;
}

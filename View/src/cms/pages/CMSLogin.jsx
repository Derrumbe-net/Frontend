import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../cms/styles/CMSLogin.css";

export default function CMSLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();

    // Mock credentials
    if (username === "admin" && password === "1234") {
      localStorage.setItem("cmsAdmin", "true");
      navigate("/cms"); // redirect to dashboard
    } else {
      alert("Invalid credentials! Try admin / 1234");
    }
  };

  return (
    <div className="cms-login">
      <div className="cms-login-box">
        <h1>Admin Login</h1>
        <form onSubmit={handleLogin}>
          <label>Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />

          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit">Login</button>
        </form>
      </div>
    </div>
  );
}

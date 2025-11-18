import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../cms/styles/CMSLogin.css";
import logo from "../../assets/Landslide_Hazard_Mitigation_Logo.avif";

export default function CMSLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  // const login_route = "http://localhost:8080/api/admins/login";
  const login_route = "https://derrumbe-test.derrumbe.net/api/admins/login";
  

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(login_route, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }), // Send the state data
      });

      if (response.ok) {
        navigate('/cms'); 
      } else {
        alert('Login Failed: Please check your username and password.');
      }
    } catch (error) {
        console.error('Login error:', error);
        alert('An error occurred. Please try again later.');
    }
  };
  
  return (
    <div className="cms-login">
      <div className="cms-login-box">
      <img src={logo} alt="Logo" className="cms-login-logo" />
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
          <a href="#" className="forgot-password">
            Forgot password?
          </a>
        </form>
      </div>
    </div>
  );
}

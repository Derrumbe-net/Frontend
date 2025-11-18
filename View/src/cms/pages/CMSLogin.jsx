import { useState } from "react";
import { useNavigate, Link } from "react-router-dom"; 
import "../../cms/styles/CMSLogin.css";
import logo from "../../assets/Landslide_Hazard_Mitigation_Logo.avif";

export default function CMSLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const login_route = "https://derrumbe-test.derrumbe.net/api/admins/login";
  const admins_base_route = "https://derrumbe-test.derrumbe.net/api/admins";
  // const login_route = "http://localhost:8080/api/admins/login";
  // const admins_base_route = "http://localhost:8080/api/admins";

  // Helper function to extract ID from JWT Token 
  const getPayloadFromToken = (token) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      return null;
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(login_route, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.token) {
        const token = data.token;

        const payload = getPayloadFromToken(token);
        const adminId = payload?.sub;

        if (!adminId) {
          alert("Error: Invalid token received.");
          return;
        }

        const userResponse = await fetch(`${admins_base_route}/${adminId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
          }
        });

        const userData = await userResponse.json();
        console.log("User Data from Server:", userData);

        if (userResponse.ok) {
          const isAuthorized = userData.isAuthorized === 1 || userData.isAuthorized === true;

          if (isAuthorized) {
            localStorage.setItem('cmsAdmin', token);
            navigate('/cms');
          } else {
            alert('Login Successful, but your account is pending authorization. Please contact an administrator.');
          }
        } else {
          alert('Failed to verify authorization status.');
        }

      } else {
        alert(data.error || 'Login Failed: Please check your credentials.');
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
          <label>Email</label>
          <input
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
          
          <Link to="/cms/signup" className="cms-signup-link">
            Don't have an account? <span style={{ color: '#007bff', fontWeight: 'bold' }}>Sign Up</span>
          </Link>
        </form>
      </div>
    </div>
  );
}
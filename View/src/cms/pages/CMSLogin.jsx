import { useState } from "react";
import { useNavigate, Link } from "react-router-dom"; 
import "../../cms/styles/CMSLogin.css";
import logo from "../../assets/Landslide_Hazard_Mitigation_Logo.avif";

export default function CMSLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const API_URL = `${import.meta.env.VITE_API_URL}`;
  const login_route = `${API_URL}/admins/login`;
  const admins_base_route = `${API_URL}/admins`;

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
          alert("Error: Token inválido recibido.");
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
            alert('Inicio de sesión exitoso, pero su cuenta está pendiente de autorización. Por favor contacte a un administrador.');
          }
        } else {
          alert('Fallo al verificar el estado de autorización.');
        }

      } else {
        alert(data.error || 'Inicio de sesión fallido: Por favor verifique sus credenciales.');
      }
    } catch (error) {
        console.error('Login error:', error);
        alert('Ocurrió un error. Por favor intente más tarde.');
    }
  };
  
  return (
    <div className="cms-login">
      <div className="cms-login-box">
      <img src={logo} alt="Logo" className="cms-login-logo" />
        <h1>Log In</h1>
        <form onSubmit={handleLogin}>
          
          <input
            type="text"
            placeholder="Correo Electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit">Iniciar Sesión</button>
          
          <Link to="/cms/signup" className="cms-signup-link">
            ¿No tienes una cuenta? <span style={{ color: '#007bff', fontWeight: 'bold' }}>Regístrate</span>
          </Link>
        </form>
      </div>
    </div>
  );
}

import { useState } from "react";
import { Link } from "react-router-dom";
import "../../cms/styles/CMSLogin.css";
import logo from "../../assets/Landslide_Hazard_Mitigation_Logo.avif";

export default function CMSForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const API_URL = `${import.meta.env.VITE_API_URL}`;
  const request_reset_route = `${API_URL}/admins/password-reset/request`;

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(request_reset_route, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("Si existe una cuenta con ese correo, se ha enviado un enlace para restablecer la contraseña.");
      } else {
        setError(data.error || "Ocurrió un error al procesar la solicitud.");
      }
    } catch (err) {
      console.error("Forgot password error:", err);
      setError("Ocurrió un error. Por favor intente más tarde.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cms-login">
      <div className="cms-login-box">
        <img src={logo} alt="Logo" className="cms-login-logo" />
        <h1> Restablecer Contraseña </h1>
        <p style={{ marginBottom: '1.5rem', color: '#666', fontSize: '0.9rem' }}>
          Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
        </p>
        
        <form onSubmit={handleRequestReset}>
          <input
            type="email"
            placeholder="Correo Electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <button type="submit" disabled={loading}>
            {loading ? "Enviando..." : "Enviar Enlace"}
          </button>

          {message && <p style={{ color: 'green', marginTop: '1rem' }}>{message}</p>}
          {error && <p style={{ color: 'red', marginTop: '1rem' }}>{error}</p>}
          
          <Link to="/cms/login" className="cms-signup-link">
            Volver al <span style={{ color: '#007bff', fontWeight: 'bold' }}>Inicio de Sesión</span>
          </Link>
        </form>
      </div>
    </div>
  );
}

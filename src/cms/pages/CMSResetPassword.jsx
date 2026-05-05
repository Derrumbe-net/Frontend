import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import "../../cms/styles/CMSLogin.css";
import logo from "../../assets/Landslide_Hazard_Mitigation_Logo.avif";

export default function CMSResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const API_URL = `${import.meta.env.VITE_API_URL}`;
  const confirm_reset_route = `${API_URL}/admins/password-reset/confirm`;

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    if (!token) {
      setError("Token de restablecimiento no válido o ausente.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(confirm_reset_route, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, new_password: newPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("Tu contraseña ha sido actualizada con éxito.");
        setSuccess(true);
      } else {
        setError(data.error || "Ocurrió un error al restablecer la contraseña.");
      }
    } catch (err) {
      console.error("Reset password error:", err);
      setError("Ocurrió un error. Por favor intente más tarde.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cms-login">
      <div className="cms-login-box">
        <img src={logo} alt="Logo" className="cms-login-logo" />
        <h1> Nueva Contraseña </h1>
        
        {!success ? (
          <form onSubmit={handleResetPassword}>
            <input
              type="password"
              placeholder="Nueva Contraseña"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
            />
            <input
              type="password"
              placeholder="Confirmar Contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
            />

            <button type="submit" disabled={loading}>
              {loading ? "Actualizando..." : "Actualizar Contraseña"}
            </button>

            {error && <p style={{ color: 'red', marginTop: '1rem' }}>{error}</p>}
          </form>
        ) : (
          <div>
            <p style={{ color: 'green', marginBottom: '1.5rem' }}>{message}</p>
            <Link to="/cms/login" className="cms-signup-link">
              Ir al <span style={{ color: '#007bff', fontWeight: 'bold' }}>Inicio de Sesión</span>
            </Link>
          </div>
        )}

        {!token && !success && (
          <p style={{ color: 'red', marginTop: '1rem' }}>
            Falta el token de seguridad. Por favor utiliza el enlace enviado a tu correo.
          </p>
        )}
      </div>
    </div>
  );
}

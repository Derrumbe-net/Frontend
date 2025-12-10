import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../../cms/styles/CMSSignUp.css";
import logo from "../../assets/Landslide_Hazard_Mitigation_Logo.avif";

export default function CMSSignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // New state variables for UI control
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const navigate = useNavigate();
  
  const API_URL = `${import.meta.env.VITE_API_URL}`;
  const signup_route = `${API_URL}/admins/signup`;

  const handleSignUp = async (e) => {
    e.preventDefault();
    
    // 1. Reset error and start loading state (disables button)
    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch(signup_route, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // 2. On success, switch the UI view
        setIsSuccess(true);
      } else {
        // Handle error without an alert popup
        setErrorMessage(data.error || 'Registro fallido: Por favor verifique su información.');
      }
    } catch (error) {
        console.error('Sign Up error:', error);
        setErrorMessage('Ocurrió un error. Por favor intente más tarde.');
    } finally {
        // 3. Stop loading (re-enables button if we are still on the form)
        setIsLoading(false);
    }
  };

  return (
    <div className="cms-signup">
      <div className="cms-signup-box">
        <img src={logo} alt="Logo" className="cms-signup-logo" />
        
        {/* CONDITIONAL RENDERING: Check if success is true */}
        {isSuccess ? (
          // SUCCESS VIEW
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <h2 style={{ color: '#28a745', marginBottom: '15px' }}>¡Cuenta creada exitosamente!</h2>
            <p style={{ lineHeight: '1.6', marginBottom: '25px', color: '#555' }}>
              Su cuenta está pendiente de confirmación. Por favor espere a que un administrador 
              apruebe su acceso antes de iniciar sesión.
            </p>
            <button 
              onClick={() => navigate('/cms/login')}
              style={{
                padding: '10px 20px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              Ir al Iniciar Sesión
            </button>
          </div>
        ) : (
          // FORM VIEW
          <>
            <h1>Sign Up</h1>
            
            <form onSubmit={handleSignUp}>
              
              <input
                type="email"
                placeholder="Correo Electrónico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                // Disable input while loading
                disabled={isLoading}
              />

              <input
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                // Disable input while loading
                disabled={isLoading}
              />

              {/* Show error message inline if it exists */}
              {errorMessage && (
                <div style={{ color: 'red', marginBottom: '10px', fontSize: '0.9em', textAlign: 'center' }}>
                  {errorMessage}
                </div>
              )}

              <button 
                type="submit" 
                disabled={isLoading}
                style={{ opacity: isLoading ? 0.7 : 1, cursor: isLoading ? 'not-allowed' : 'pointer' }}
              >
                {isLoading ? "Procesando..." : "Crear Cuenta"}
              </button>
              
              <Link to="/cms/login" className="cms-signup-link" style={{ pointerEvents: isLoading ? 'none' : 'auto' }}>
                ¿Ya tienes una cuenta? <span style={{ color: '#007bff', fontWeight: 'bold' }}>Inicia Sesión</span>
              </Link>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

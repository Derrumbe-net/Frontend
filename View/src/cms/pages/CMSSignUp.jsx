import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../../cms/styles/CMSSignUp.css";
import logo from "../../assets/Landslide_Hazard_Mitigation_Logo.avif";

export default function CMSSignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false); 

  const [criteria, setCriteria] = useState({
    length: false,
    upper: false,
    lower: false,
    number: false,
    special: false
  });
  
  const navigate = useNavigate();
  const API_URL = `${import.meta.env.VITE_API_URL}`;
  const signup_route = `${API_URL}/admins/signup`;

  useEffect(() => {
    setCriteria({
      length: password.length >= 8,
      upper: /[A-Z]/.test(password),
      lower: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    });
  }, [password]);

  const getStrengthScore = () => Object.values(criteria).filter(Boolean).length;

  const getStrengthColor = (score) => {
    if (score <= 2) return "#dc3545"; 
    if (score === 3) return "#ffc107"; 
    if (score >= 4) return "#28a745"; 
    return "#e0e0e0";
  };

  const handleSignUp = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert("Las contraseñas no coinciden. Por favor verifique.");
      return;
    }

    if (getStrengthScore() < 4) {
      alert("La contraseña no es lo suficientemente segura.");
      return;
    }

    try {
      const response = await fetch(signup_route, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        alert("¡Cuenta creada exitosamente!");
        navigate('/cms/login'); 
      } else {
        alert(data.error || 'Registro fallido.');
      }
    } catch (error) {
        console.error('Sign Up error:', error);
        alert('Ocurrió un error. Por favor intente más tarde.');
    }
  };

  const EyeIcon = ({ isVisible }) => (
    isVisible ? (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
         <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
         <line x1="1" y1="1" x2="23" y2="23"></line>
      </svg>
    ) : (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
        <circle cx="12" cy="12" r="3"></circle>
      </svg>
    )
  );

  return (
    <div className="cms-signup">
      <div className="cms-signup-box">
        <img src={logo} alt="Logo" className="cms-signup-logo" />
        <h1> Regístrate </h1>
        
        <form onSubmit={handleSignUp}>
          
          <input
            type="email"
            placeholder="Correo Electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <div className="input-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button 
              type="button" 
              className="eye-icon"
              onClick={() => setShowPassword(!showPassword)}
              title={showPassword ? "Ocultar" : "Mostrar"}
            >
              <EyeIcon isVisible={showPassword} />
            </button>
          </div>

          <div className="input-wrapper">
            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirmar Contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <button 
              type="button" 
              className="eye-icon"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              title={showConfirmPassword ? "Ocultar" : "Mostrar"}
            >
               <EyeIcon isVisible={showConfirmPassword} />
            </button>
          </div>

          {/* Strength Meter & Checklist */}
          <div className="strength-meter-container">
            <div 
              className="strength-meter-fill" 
              style={{
                width: `${(getStrengthScore() / 5) * 100}%`,
                backgroundColor: getStrengthColor(getStrengthScore())
              }}
            />
          </div>

          <ul className="password-criteria">
            <li className={`criteria-item ${criteria.length ? 'valid' : 'invalid'}`}>
              {criteria.length ? '✔' : '○'} Mínimo 8 caracteres
            </li>
            <li className={`criteria-item ${criteria.upper ? 'valid' : 'invalid'}`}>
              {criteria.upper ? '✔' : '○'} Una mayúscula
            </li>
            <li className={`criteria-item ${criteria.lower ? 'valid' : 'invalid'}`}>
              {criteria.lower ? '✔' : '○'} Una minúscula
            </li>
            <li className={`criteria-item ${criteria.number ? 'valid' : 'invalid'}`}>
              {criteria.number ? '✔' : '○'} Un número
            </li>
            <li className={`criteria-item ${criteria.special ? 'valid' : 'invalid'}`}>
              {criteria.special ? '✔' : '○'} Un símbolo
            </li>
          </ul>

          <button type="submit">Crear Cuenta</button>
          
          <Link to="/cms/login" className="cms-signup-link">
            ¿Ya tienes una cuenta? <span style={{ color: '#007bff', fontWeight: 'bold' }}>Inicia Sesión</span>
          </Link>
        </form>
      </div>
    </div>
  );
}
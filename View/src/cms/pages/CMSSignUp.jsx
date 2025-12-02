import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../../cms/styles/CMSSignUp.css";
import logo from "../../assets/Landslide_Hazard_Mitigation_Logo.avif";

export default function CMSSignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  
  // const signup_route = "http://localhost:8080/api/admins/signup";
  const signup_route = "https://derrumbe-test.derrumbe.net/api/admins/signup";

  const handleSignUp = async (e) => {
    e.preventDefault();
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
        alert("¡Cuenta creada exitosamente!\n\nSu cuenta está pendiente de confirmación. Por favor espere a que un administrador apruebe su acceso antes de iniciar sesión.");
        navigate('/cms/login'); 
      } else {
        alert(data.error || 'Registro fallido: Por favor verifique su información.');
      }
    } catch (error) {
        console.error('Sign Up error:', error);
        alert('Ocurrió un error. Por favor intente más tarde.');
    }
  };

  return (
    <div className="cms-signup">
      <div className="cms-signup-box">
        <img src={logo} alt="Logo" className="cms-signup-logo" />
        <h1>Sign Up</h1>
        
        <form onSubmit={handleSignUp}>
          
          <input
            type="email"
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

          <button type="submit">Crear Cuenta</button>
          
          <Link to="/cms/login" className="cms-signup-link">
            ¿Ya tienes una cuenta? <span style={{ color: '#007bff', fontWeight: 'bold' }}>Inicia Sesión</span>
          </Link>
        </form>
      </div>
    </div>
  );
}
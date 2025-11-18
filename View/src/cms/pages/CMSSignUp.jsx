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
        alert("Account created successfully!\n\nYour account is currently pending confirmation. Please wait for an administrator to approve your access before logging in.");
        navigate('/cms/login'); 
      } else {
        alert(data.error || 'Sign Up Failed: Please check your input.');
      }
    } catch (error) {
        console.error('Sign Up error:', error);
        alert('An error occurred. Please try again later.');
    }
  };

  return (
    <div className="cms-signup">
      <div className="cms-signup-box">
        <img src={logo} alt="Logo" className="cms-signup-logo" />
        <h1>Admin Sign Up</h1>
        
        <form onSubmit={handleSignUp}>
          
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit">Create Account</button>
          
          <Link to="/cms/login" className="cms-signup-link">
            Already have an account? <span style={{ color: '#007bff', fontWeight: 'bold' }}>Login</span>
          </Link>
        </form>
      </div>
    </div>
  );
}
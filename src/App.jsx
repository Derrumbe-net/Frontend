import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import './App.css';

function App() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div id="root" style={{ width: '100%', overflowX: 'hidden' }}>
      <Navbar />
      <Outlet />
      <Footer />

      {/* Under Development Temp Banner */}
      <div style={{
        position: 'fixed',
        top: '40px',
        left: '-40px',
        width: '200px',
        backgroundColor: '#5a0a1a',
        color: 'white',
        textAlign: 'center',
        padding: '6px 0',
        fontSize: '0.65rem',
        fontWeight: 800,
        letterSpacing: '0.1em',
        fontFamily: 'Inter, sans-serif',
        transform: 'rotate(-45deg)',
        zIndex: 99999,
        boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
        pointerEvents: 'none',
        userSelect: 'none',
      }}>
        EN DESARROLLO
      </div>
    </div>
  );
}

export default App;


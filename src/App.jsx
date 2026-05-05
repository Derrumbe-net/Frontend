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
    </div>
  );
}

export default App;


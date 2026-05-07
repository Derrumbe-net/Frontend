import { Link } from 'react-router-dom';
import logo404 from '../assets/404_page_logo.png';

function NotFound() {
  const isMobile = window.innerWidth < 768;

  return (
    <div style={{
      height: 'calc(100vh - 170px)',
      backgroundColor: '#dfe8da',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Inter', sans-serif",
      padding: isMobile ? '2rem 1.5rem' : '0 4rem',
      boxSizing: 'border-box',
      overflow: 'hidden',
    }}>
      <div style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1.5rem',
        maxWidth: '1650px',
        width: '100%',
      }}>

        {/* LEFT / TOP — Text content */}
        <div style={{ flex: '0 0 auto', maxWidth: isMobile ? '100%' : '420px', zIndex: 2 }}>
          <p style={{ color: '#3b7d23', fontWeight: 800, fontSize: isMobile ? '0.8rem' : '1rem', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '0.5rem' }}>
            Error 404
          </p>
          <h1 style={{ fontSize: isMobile ? '3rem' : 'clamp(4rem, 6vw, 6rem)', fontWeight: 900, color: '#13241e', lineHeight: 1, margin: '0 0 0.5rem' }}>
            ¡Oops!
          </h1>
          <h2 style={{ fontSize: isMobile ? '1.4rem' : 'clamp(1.5rem, 3vw, 2.8rem)', fontWeight: 800, color: '#13241e', lineHeight: 1.15, margin: '0 0 0.75rem' }}>
            Algo salió mal.
          </h2>
          <p style={{ color: '#465a52', fontSize: isMobile ? '0.9rem' : '1.05rem', lineHeight: 1.7, marginBottom: '1rem' }}>
            La página que buscas no fue encontrada.
          </p>

          <div style={{ marginBottom: '1.5rem' }}>
            <p style={{ color: '#3b7d23', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.6rem' }}>
              Causas probables
            </p>
            {[
              'La URL fue escrita incorrectamente',
              'La página fue movida o eliminada',
              'No tienes permiso para acceder a esta sección',
            ].map((cause, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#3b7d23', flexShrink: 0 }} />
                <p style={{ color: '#2d4a2d', fontSize: isMobile ? '0.85rem' : '1rem', margin: 0, lineHeight: 1.5 }}>{cause}</p>
              </div>
            ))}
          </div>

          <Link
            to="/"
            style={{ display: 'inline-block', padding: '0.85rem 2rem', backgroundColor: '#3b7d23', color: 'white', borderRadius: '999px', textDecoration: 'none', fontWeight: 700, fontSize: isMobile ? '0.9rem' : '1rem', boxShadow: '0 6px 18px rgba(59,125,35,0.25)' }}
            onMouseOver={e => e.currentTarget.style.backgroundColor = '#2d6018'}
            onMouseOut={e => e.currentTarget.style.backgroundColor = '#3b7d23'}
          >
            Volver a página de inicio
          </Link>
        </div>

        {/* RIGHT / BOTTOM — Image */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'flex-end', marginLeft: isMobile ? 0 : '2rem' }}>
          <img
            src={logo404}
            alt="404 illustration"
            style={{
              width: isMobile ? '120%' : '135%',
              maxWidth: isMobile ? '520px' : '1150px',
              height: 'auto',
              objectFit: 'contain',
              userSelect: 'none',
              pointerEvents: 'none',
              transform: isMobile ? 'none' : 'translateY(70px)',
            }}
          />
        </div>

      </div>
    </div>
  );
}

export default NotFound;
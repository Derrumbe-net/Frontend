import { createBrowserRouter } from 'react-router-dom';

// Main webpage
import App from './App';
import Home from './pages/Home';
import About from './pages/About';
import Guide from './pages/Guide';
import InteractiveMap from './pages/InteractiveMap';
import LandslideReadyPR_Individuos from './pages/LandslideReadyPR_Individuos';
import LandslideReadyPR_Municipios from './pages/LandslideReadyPR_Municipios';
import Projects from './pages/Projects';
import Publications from './pages/Publications';
import RainForecast from './pages/RainForecast';
import Report from './pages/Report';
import Request from './pages/Request'
import Stations from './pages/Stations';
import SusceptibilityMap from './pages/SusceptibilityMap';
import SusceptibilityMunicipalitiesMap from './pages/SusceptibilityMunicipalitiesMap';

// CMS (Admin Dashboard)
import CMSLayout from './cms/layout/CMSLayout';
import CMSDashboard from './cms/pages/CMSDashboard';
import CMSLogin from './cms/pages/CMSLogin';
import CMSSignUp from './cms/pages/CMSSignUp';
import CMSProjects from './cms/pages/CMSProjects';
import CMSPublications from './cms/pages/CMSPublications';
import CMSReports from './cms/pages/CMSReports';
import CMSStations from './cms/pages/CMSStations';
import CMSManageUsers from './cms/pages/CMSManageUsers';

// Auth protection
import ProtectedRoute from './cms/layout/ProtectedRoute';

const router = createBrowserRouter([
  // Main webpage routes
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Home /> },
      { path: 'sobre-nosotros', element: <About /> },
      { path: 'proyectos', element: <Projects /> },
      { path: 'publicaciones', element: <Publications /> },
      { path: 'mapa-interactivo', element: <InteractiveMap /> },
      { path: 'estaciones', element: <Stations /> },
      { path: 'pronostico-lluvia', element: <RainForecast /> },
      { path: 'guia-deslizamientos', element: <Guide /> },
      { path: 'mapa-susceptibilidad', element: <SusceptibilityMap /> },
      { path: 'mapa-susceptibilidad-municipios', element: <SusceptibilityMunicipalitiesMap /> },
      { path: 'reportar', element: <Report /> },
      { path: 'solicitud', element: <Request />},
      { path: 'landslideready-individuos', element: <LandslideReadyPR_Individuos /> },
      { path: 'landslideready-municipios', element: <LandslideReadyPR_Municipios /> },
    ],
  },

  // CMS routes
  {
    path: '/cms/login',
    element: <CMSLogin />,
  },
  {
    path: '/cms/signup',
    element: <CMSSignUp />,
  },
  {
    path: '/cms',
    element: (
      <ProtectedRoute>
        <CMSLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <CMSDashboard /> },
      { path: 'proyectos', element: <CMSProjects /> },
      { path: 'publicaciones', element: <CMSPublications /> },
      { path: 'reportes', element: <CMSReports /> },
      { path: 'estaciones', element: <CMSStations /> },
      { path: 'usuarios', element: <CMSManageUsers /> },
    ],
  },
]);

export default router;
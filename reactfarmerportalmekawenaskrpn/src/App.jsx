import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useApp } from './state/AppContext.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import { BottomNav, OfflineBanner, SmsBanner, Toast } from './components/UI.jsx';
import Splash from './pages/Splash.jsx';
import Welcome from './pages/Welcome.jsx';
import Language from './pages/Language.jsx';
import Login from './pages/Login.jsx';
import Otp from './pages/Otp.jsx';
import Home from './pages/Home.jsx';
import Water from './pages/Water.jsx';
import Report from './pages/Report.jsx';
import Forecast from './pages/Forecast.jsx';
import Alerts from './pages/Alerts.jsx';
import Fields from './pages/Fields.jsx';
import Profile from './pages/Profile.jsx';
import RegIdentity from './pages/register/RegIdentity.jsx';
import RegCrops from './pages/register/RegCrops.jsx';
import RegPin from './pages/register/RegPin.jsx';
import RegWater from './pages/register/RegWater.jsx';
import RegReview from './pages/register/RegReview.jsx';
import RegDone from './pages/register/RegDone.jsx';
import NotFound from './pages/NotFound.jsx';
import ErrorScreen from './pages/ErrorScreen.jsx';

function RequireAuth({ children }) {
  const { user } = useApp();
  const loc = useLocation();
  if (!user) return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  return children;
}

const NAV_ROUTES = ['/home', '/water', '/report', '/fields', '/profile', '/alerts', '/forecast'];

export default function App() {
  const { pathname } = useLocation();
  const showNav = NAV_ROUTES.includes(pathname);
  const lang = useApp().lang;

  return (
    <div className="stage">
      <div className={`device lang-${lang}`}>
        <OfflineBanner />
        <SmsBanner />
        <ErrorBoundary key={pathname}>
          <main className={`viewport ${showNav ? 'has-nav' : ''}`} key={pathname}>
            <Routes>
              <Route path="/" element={<Splash />} />
              <Route path="/welcome" element={<Welcome />} />
              <Route path="/language" element={<Language />} />
              <Route path="/login" element={<Login />} />
              <Route path="/otp" element={<Otp />} />
              <Route path="/home" element={<RequireAuth><Home /></RequireAuth>} />
              <Route path="/water" element={<RequireAuth><Water /></RequireAuth>} />
              <Route path="/report" element={<RequireAuth><Report /></RequireAuth>} />
              <Route path="/forecast" element={<RequireAuth><Forecast /></RequireAuth>} />
              <Route path="/alerts" element={<RequireAuth><Alerts /></RequireAuth>} />
              <Route path="/fields" element={<RequireAuth><Fields /></RequireAuth>} />
              <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
              <Route path="/register" element={<Navigate to="/register/identity" replace />} />
              <Route path="/register/identity" element={<RequireAuth><RegIdentity /></RequireAuth>} />
              <Route path="/register/crops" element={<RequireAuth><RegCrops /></RequireAuth>} />
              <Route path="/register/pin" element={<RequireAuth><RegPin /></RequireAuth>} />
              <Route path="/register/water" element={<RequireAuth><RegWater /></RequireAuth>} />
              <Route path="/register/review" element={<RequireAuth><RegReview /></RequireAuth>} />
              <Route path="/register/done" element={<RequireAuth><RegDone /></RequireAuth>} />
              <Route path="/error" element={<ErrorScreen />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </ErrorBoundary>
        {showNav && <BottomNav />}
        <Toast />
      </div>
    </div>
  );
}

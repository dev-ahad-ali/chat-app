import { Navigate, useLocation } from 'react-router';
import useAuth from '../hooks/useAuth.js';

function PublicRoute({ children }) {
  const isLoggedIn = useAuth();
  const location = useLocation();

  return !isLoggedIn ? (
    children
  ) : (
    <Navigate to={location.pathname === '/' ? '/inbox' : location.pathname} />
  );
}

export default PublicRoute;

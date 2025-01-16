import { Navigate } from 'react-router';
import useAuth from '../hooks/useAuth.js';

function PrivateRoute({ children }) {
  const isLoggedIn = useAuth();

  return isLoggedIn ? children : <Navigate to={'/'} />;
}

export default PrivateRoute;

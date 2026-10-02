import { createBrowserRouter, Navigate } from 'react-router-dom';
import App from '../App';
import { CustomerAccountPage } from '../pages/CustomerAccountPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
  },
  {
    path: '/account',
    element: <CustomerAccountPage />,
  },
  {
    path: '/profile',
    element: <Navigate to="/account?tab=profile" replace />,
  },
  {
    path: '/my-inquiries',
    element: <Navigate to="/account?tab=inquiries" replace />,
  },
  {
    path: '/my-designs',
    element: <Navigate to="/account?tab=designs" replace />,
  },
  {
    path: '/login',
    element: <Navigate to="/?auth=login" replace />,
  },
  {
    path: '/register',
    element: <Navigate to="/?auth=register" replace />,
  },
  {
    path: '/catalog',
    element: <Navigate to="/#collections" replace />,
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);

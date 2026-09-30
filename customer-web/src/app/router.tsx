import { createBrowserRouter } from 'react-router-dom';
import App from '../App';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
  },
  {
    path: '/login',
    element: <div className="p-8 text-center text-xl font-bold">Customer Login</div>,
  },
  {
    path: '/catalog',
    element: <div className="p-8 text-center text-xl font-bold">Jewellery Catalog</div>,
  },
]);

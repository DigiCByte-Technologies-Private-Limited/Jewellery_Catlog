import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { router } from './app/router';
import { ToastContainer } from './components/ui/Toast';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 5 * 60 * 1000 } }
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastContainer>
        <RouterProvider router={router} />
      </ToastContainer>
    </QueryClientProvider>
  );
}

export default App;

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Header } from './components/Header';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProfilePage } from './pages/ProfilePage';
import { WholesaleCatalogPage } from './pages/WholesaleCatalogPage';
import { AssignedCustomersPage } from './pages/AssignedCustomersPage';
import { SubmitProposalPage } from './pages/SubmitProposalPage';
import { MySubmissionsPage } from './pages/MySubmissionsPage';
import { SubmissionDetailPage } from './pages/SubmissionDetailPage';
import { useAuthStore } from './store/authStore';
import './index.css';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-[#FAF8F5]">
        <Header />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/catalog" element={<WholesaleCatalogPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/assigned-customers"
              element={
                <ProtectedRoute>
                  <AssignedCustomersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />

            {/* Open / Partner Flow Routes */}
            <Route path="/submit" element={<SubmitProposalPage />} />
            <Route path="/my-submissions" element={<MySubmissionsPage />} />
            <Route path="/submission/:id" element={<SubmissionDetailPage />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1C1917',
              color: '#FAF8F5',
              borderRadius: '12px',
              border: '1px solid #3D3530',
              fontSize: '13px',
            },
            success: { iconTheme: { primary: '#B89047', secondary: '#FAF8F5' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#FAF8F5' } },
          }}
        />
      </div>
    </BrowserRouter>
  );
}

export default App;

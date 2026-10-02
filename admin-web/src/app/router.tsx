import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AdminLayout } from '../components/layout/AdminLayout';
import { LoginPage } from '../pages/auth/LoginPage';
import { DashboardPage } from '../pages/dashboard/DashboardPage';
import { ProductsPage } from '../pages/products/ProductsPage';
import { ProductFormPage } from '../pages/products/ProductFormPage';
import { MetalRatesPage } from '../pages/metal-rates/MetalRatesPage';
import { CategoriesPage } from '../pages/categories/CategoriesPage';
import { UsersPage } from '../pages/users/UsersPage';
import { ApprovalsPage } from '../pages/approvals/ApprovalsPage';
import { AuditLogsPage } from '../pages/audit/AuditLogsPage';
import { ProductDetailPage } from '../pages/products/ProductDetailPage';
import { InventoryPage } from '../pages/inventory/InventoryPage';
import { KarigarPage } from '../pages/karigar/KarigarPage';
import { OldGoldPage } from '../pages/old-gold/OldGoldPage';
import { BookingsPage } from '../pages/bookings/BookingsPage';
import { EnquiriesPage } from '../pages/enquiries/EnquiriesPage';
import { RequestsPage } from '../pages/requests/RequestsPage';
import { CustomDesignsPage } from '../pages/custom-designs/CustomDesignsPage';
import { WholesaleSubmissionsPage } from '../pages/wholesale/WholesaleSubmissionsPage';
import { WholesalePartnersPage } from '../pages/wholesale-partners/WholesalePartnersPage';
import { CustomersPage } from '../pages/customers/CustomersPage';
import { StoragePage } from '../pages/storage/StoragePage';
import { SubscriptionsPage } from '../pages/subscriptions/SubscriptionsPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />
  },
  {
    path: '/login',
    element: <LoginPage />
  },
  {
    path: '/',
    element: <AdminLayout />,
    children: [
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'products', element: <ProductsPage /> },
      { path: 'products/new', element: <ProductFormPage /> },
      { path: 'products/:id', element: <ProductDetailPage /> },
      { path: 'inventory', element: <InventoryPage /> },
      { path: 'karigar', element: <KarigarPage /> },
      { path: 'old-gold', element: <OldGoldPage /> },
      { path: 'bookings', element: <BookingsPage /> },
      { path: 'requests', element: <RequestsPage /> },
      { path: 'custom-designs', element: <CustomDesignsPage /> },
      { path: 'wholesale-submissions', element: <WholesaleSubmissionsPage /> },
      { path: 'wholesale-partners', element: <WholesalePartnersPage /> },
      { path: 'enquiries', element: <EnquiriesPage /> },
      { path: 'customers', element: <CustomersPage /> },
      { path: 'storage', element: <StoragePage /> },
      { path: 'subscriptions', element: <SubscriptionsPage /> },
      { path: 'metal-rates', element: <MetalRatesPage /> },
      { path: 'categories', element: <CategoriesPage /> },
      { path: 'users', element: <UsersPage /> },
      { path: 'approvals', element: <ApprovalsPage /> },
      { path: 'audit-logs', element: <AuditLogsPage /> },
    ]
  },
  {
    path: '*',
    element: <div>404 Not Found</div>
  }
]);

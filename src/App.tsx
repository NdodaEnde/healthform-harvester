
import './App.css';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Auth from './pages/Auth';
import Index from './pages/Index';
import Dashboard from './pages/Dashboard';
import NotFound from './pages/NotFound';
import { AuthProvider } from './contexts/AuthContext';
import { OrganizationProvider } from './contexts/OrganizationContext';
import { ThemeProvider } from 'next-themes';
import { Toaster } from './components/ui/sonner';
import PatientsPage from './pages/PatientsPage';
import FirstTimeSetupPage from './pages/FirstTimeSetupPage';
import UpdatePasswordPage from './pages/UpdatePasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import AcceptInvitePage from './pages/AcceptInvitePage';
import DocumentViewer from './pages/DocumentViewer';
import OrganizationsListPage from './pages/OrganizationsListPage';
import { Helmet } from 'react-helmet';
import PatientRecordsPage from './pages/PatientRecordsPage';
import PatientDetailPage from './pages/PatientDetailPage';
import PatientEditPage from './pages/PatientEditPage';
import OrganizationSettingsPage from './pages/settings/OrganizationSettingsPage';
import OrganizationsPage from './pages/admin/OrganizationsPage';
import OrganizationUsersPage from './pages/admin/OrganizationUsersPage';
import OrganizationClientsPage from './pages/admin/OrganizationClientsPage';
import CreateOrganizationPage from './pages/admin/CreateOrganizationPage';
import EditOrganizationPage from './pages/admin/EditOrganizationPage';
import TemplatesListPage from './pages/templates/TemplatesListPage';
import EditTemplatePage from './pages/templates/EditTemplatePage';
import ViewTemplatePage from './pages/templates/ViewTemplatePage';

const queryClient = new QueryClient();

const router = createBrowserRouter([
  {
    path: '/',
    element: <Index />,
  },
  {
    path: '/login',
    element: <Auth view="sign_in" />,
  },
  {
    path: '/signup',
    element: <Auth view="sign_up" />,
  },
  {
    path: '/organizations',
    element: <OrganizationsListPage />,
  },
  {
    path: '/reset-password',
    element: <ResetPasswordPage />,
  },
  {
    path: '/update-password',
    element: <UpdatePasswordPage />,
  },
  {
    path: '/invite/:token',
    element: <AcceptInvitePage />,
  },
  {
    path: '/first-time-setup',
    element: <FirstTimeSetupPage />,
  },
  {
    path: '/dashboard',
    element: <Dashboard />,
  },
  {
    path: '/patients',
    element: <PatientsPage />,
  },
  {
    path: '/patients/:patientId',
    element: <PatientDetailPage />,
  },
  {
    path: '/patients/:patientId/edit',
    element: <PatientEditPage />,
  },
  {
    path: '/patient-records',
    element: <PatientRecordsPage />,
  },
  {
    path: '/settings',
    element: <OrganizationSettingsPage />,
  },
  // Templates routes
  {
    path: '/templates',
    element: <TemplatesListPage />,
  },
  {
    path: '/templates/new',
    element: <EditTemplatePage />,
  },
  {
    path: '/templates/edit/:id',
    element: <EditTemplatePage />,
  },
  {
    path: '/templates/view/:id',
    element: <ViewTemplatePage />,
  },
  // Admin routes
  {
    path: '/admin/organizations',
    element: <OrganizationsPage />,
  },
  {
    path: '/admin/organizations/new',
    element: <CreateOrganizationPage />,
  },
  {
    path: '/admin/organizations/:organizationId/edit',
    element: <EditOrganizationPage />,
  },
  {
    path: '/admin/users',
    element: <OrganizationUsersPage />,
  },
  {
    path: '/admin/clients',
    element: <OrganizationClientsPage />,
  },
  {
    path: '/documents/:documentId',
    element: <DocumentViewer />,
  },
  {
    path: '*',
    element: <NotFound />,
  },
]);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <Helmet
          titleTemplate="%s | Health Portal"
          defaultTitle="Health Portal"
        />
        <AuthProvider>
          <OrganizationProvider>
            <RouterProvider router={router} />
            <Toaster closeButton />
          </OrganizationProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;

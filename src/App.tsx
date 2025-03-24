
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { OrganizationProvider } from '@/contexts/OrganizationContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { Helmet } from 'react-helmet';
import './App.css';

// Pages
import Index from '@/pages/Index';
import Auth from '@/pages/Auth';
import Dashboard from '@/pages/Dashboard';
import NotFound from '@/pages/NotFound';
import ResetPasswordPage from '@/pages/ResetPasswordPage';
import UpdatePasswordPage from '@/pages/UpdatePasswordPage';
import FirstTimeSetupPage from '@/pages/FirstTimeSetupPage';
import OrganizationsListPage from '@/pages/OrganizationsListPage';
import PatientsPage from '@/pages/PatientsPage';
import PatientDetailPage from '@/pages/PatientDetailPage';
import PatientEditPage from '@/pages/PatientEditPage';
import PatientRecordsPage from '@/pages/PatientRecordsPage';
import DocumentViewer from '@/pages/DocumentViewer';
import AcceptInvitePage from '@/pages/AcceptInvitePage';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as SonnerToaster } from 'sonner';
import TemplatesListPage from '@/pages/templates/TemplatesListPage';
import EditTemplatePage from '@/pages/templates/EditTemplatePage';
import ViewTemplatePage from '@/pages/templates/ViewTemplatePage';

// Admin Pages
import OrganizationsPage from '@/pages/admin/OrganizationsPage';
import CreateOrganizationPage from '@/pages/admin/CreateOrganizationPage';
import EditOrganizationPage from '@/pages/admin/EditOrganizationPage';
import OrganizationClientsPage from '@/pages/admin/OrganizationClientsPage';
import OrganizationUsersPage from '@/pages/admin/OrganizationUsersPage';

// Settings Pages
import OrganizationSettingsPage from '@/pages/settings/OrganizationSettingsPage';

import OrganizationProtectedRoute from '@/components/OrganizationProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

function App() {
  return (
    <ThemeProvider defaultTheme="light" enableSystem>
      <Helmet>
        <title>Health Portal</title>
        <meta name="description" content="Health Portal - Manage patient records and medical documents" />
      </Helmet>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <OrganizationProvider>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Auth view="sign_in" />} />
                <Route path="/register" element={<Auth view="sign_up" />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/update-password" element={<UpdatePasswordPage />} />
                <Route path="/accept-invite" element={<AcceptInvitePage />} />
                <Route path="/setup" element={<FirstTimeSetupPage />} />
                <Route path="/organizations" element={<OrganizationsListPage />} />

                {/* Protected Routes */}
                <Route element={<OrganizationProtectedRoute />}>
                  <Route element={<DashboardLayout />}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/patients" element={<PatientsPage />} />
                    <Route path="/patients/:id" element={<PatientDetailPage />} />
                    <Route path="/patients/:id/edit" element={<PatientEditPage />} />
                    <Route path="/patients/:id/records" element={<PatientRecordsPage />} />
                    <Route path="/documents/:id" element={<DocumentViewer />} />
                    <Route path="/templates" element={<TemplatesListPage />} />
                    <Route path="/templates/edit/:id" element={<EditTemplatePage />} />
                    <Route path="/templates/view/:id" element={<ViewTemplatePage />} />

                    {/* Admin Routes */}
                    <Route path="/admin/organizations" element={<OrganizationsPage />} />
                    <Route path="/admin/organizations/new" element={<CreateOrganizationPage />} />
                    <Route path="/admin/organizations/:id" element={<EditOrganizationPage />} />
                    <Route path="/admin/organizations/:id/clients" element={<OrganizationClientsPage />} />
                    <Route path="/admin/organizations/:id/users" element={<OrganizationUsersPage />} />

                    {/* Settings Routes */}
                    <Route path="/settings" element={<OrganizationSettingsPage />} />
                  </Route>
                </Route>

                <Route path="*" element={<NotFound />} />
              </Routes>
              <Toaster />
              <SonnerToaster position="top-right" richColors />
            </OrganizationProvider>
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;

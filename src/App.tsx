import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { OrganizationProvider } from './contexts/OrganizationContext';
import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from "sonner";
import { Helmet } from 'react-helmet';
import { DashboardLayout } from './components/DashboardLayout';

// Import pages and components
import Dashboard from './pages/Dashboard';
import DocumentsPage from './pages/DocumentsPage';
import DocumentViewer from './pages/DocumentViewer';
import CertificateTemplatesPage from './pages/certificates/CertificateTemplatesPage';
import OrganizationsPage from './pages/admin/OrganizationsPage';
import CreateOrganizationPage from './pages/admin/CreateOrganizationPage';
import EditOrganizationPage from './pages/admin/EditOrganizationPage';
import OrganizationUsersPage from './pages/admin/OrganizationUsersPage';
import OrganizationClientsPage from './pages/admin/OrganizationClientsPage';
import OrganizationSettingsPage from './pages/settings/OrganizationSettingsPage';
import PatientsPage from './pages/PatientsPage';
import PatientDetailPage from './pages/PatientDetailPage';
import PatientEditPage from './pages/PatientEditPage';
import PatientRecordsPage from './pages/PatientRecordsPage';
import Index from './pages/Index';
import Auth from './pages/Auth';
import ResetPasswordPage from './pages/ResetPasswordPage';
import UpdatePasswordPage from './pages/UpdatePasswordPage';
import AcceptInvitePage from './pages/AcceptInvitePage';
import FirstTimeSetupPage from './pages/FirstTimeSetupPage';
import NotFound from './pages/NotFound';
import HeaderComponent from './components/HeaderComponent';
import OrganizationProtectedRoute from './components/OrganizationProtectedRoute';

// Create a client
const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="bg-gray-50 dark:bg-gray-950 min-h-screen">
        <BrowserRouter>
          <AuthProvider>
            <OrganizationProvider>
              <Helmet defaultTitle="Medical Certificates" titleTemplate="%s | Medical Certificates" />
              <HeaderComponent />
              <main>
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/reset-password" element={<ResetPasswordPage />} />
                  <Route path="/update-password" element={<UpdatePasswordPage />} />
                  <Route path="/accept-invite" element={<AcceptInvitePage />} />
                  <Route path="/setup" element={<FirstTimeSetupPage />} />
                  
                  {/* Protected Routes with Dashboard Layout */}
                  <Route path="/dashboard" element={
                    <OrganizationProtectedRoute>
                      <DashboardLayout>
                        <Dashboard />
                      </DashboardLayout>
                    </OrganizationProtectedRoute>
                  } />
                  
                  {/* Document Management */}
                  <Route path="/documents" element={
                    <OrganizationProtectedRoute>
                      <DashboardLayout>
                        <DocumentsPage />
                      </DashboardLayout>
                    </OrganizationProtectedRoute>
                  } />
                  
                  <Route path="/documents/:id" element={
                    <OrganizationProtectedRoute>
                      <DashboardLayout>
                        <DocumentViewer />
                      </DashboardLayout>
                    </OrganizationProtectedRoute>
                  } />
                  
                  {/* Certificate Management */}
                  <Route path="/certificates/templates" element={
                    <OrganizationProtectedRoute>
                      <DashboardLayout>
                        <CertificateTemplatesPage />
                      </DashboardLayout>
                    </OrganizationProtectedRoute>
                  } />
                  
                  {/* Organization Management */}
                  <Route path="/admin/organizations" element={
                    <OrganizationProtectedRoute>
                      <DashboardLayout>
                        <OrganizationsPage />
                      </DashboardLayout>
                    </OrganizationProtectedRoute>
                  } />
                  
                  <Route path="/admin/organizations/new" element={
                    <OrganizationProtectedRoute>
                      <DashboardLayout>
                        <CreateOrganizationPage />
                      </DashboardLayout>
                    </OrganizationProtectedRoute>
                  } />
                  
                  <Route path="/admin/organizations/:id/edit" element={
                    <OrganizationProtectedRoute>
                      <DashboardLayout>
                        <EditOrganizationPage />
                      </DashboardLayout>
                    </OrganizationProtectedRoute>
                  } />
                  
                  <Route path="/admin/organizations/:id/users" element={
                    <OrganizationProtectedRoute>
                      <DashboardLayout>
                        <OrganizationUsersPage />
                      </DashboardLayout>
                    </OrganizationProtectedRoute>
                  } />
                  
                  <Route path="/admin/organizations/:id/clients" element={
                    <OrganizationProtectedRoute>
                      <DashboardLayout>
                        <OrganizationClientsPage />
                      </DashboardLayout>
                    </OrganizationProtectedRoute>
                  } />
                  
                  {/* Settings Pages */}
                  <Route path="/settings/organization" element={
                    <OrganizationProtectedRoute>
                      <DashboardLayout>
                        <OrganizationSettingsPage />
                      </DashboardLayout>
                    </OrganizationProtectedRoute>
                  } />
                  
                  {/* Patient Management Routes */}
                  <Route path="/patients" element={
                    <OrganizationProtectedRoute>
                      <DashboardLayout>
                        <PatientsPage />
                      </DashboardLayout>
                    </OrganizationProtectedRoute>
                  } />
                  
                  <Route path="/patients/:id" element={
                    <OrganizationProtectedRoute>
                      <DashboardLayout>
                        <PatientDetailPage />
                      </DashboardLayout>
                    </OrganizationProtectedRoute>
                  } />
                  
                  <Route path="/patients/:id/edit" element={
                    <OrganizationProtectedRoute>
                      <DashboardLayout>
                        <PatientEditPage />
                      </DashboardLayout>
                    </OrganizationProtectedRoute>
                  } />
                  
                  <Route path="/patients/:id/records" element={
                    <OrganizationProtectedRoute>
                      <DashboardLayout>
                        <PatientRecordsPage />
                      </DashboardLayout>
                    </OrganizationProtectedRoute>
                  } />
                  
                  {/* New Role-Based Routes */}
                  <Route path="/appointments" element={
                    <OrganizationProtectedRoute>
                      <DashboardLayout>
                        <div className="mt-4">
                          <h1 className="text-3xl font-bold mb-4">Appointments</h1>
                          <p className="text-muted-foreground">This page is coming soon.</p>
                        </div>
                      </DashboardLayout>
                    </OrganizationProtectedRoute>
                  } />
                  
                  <Route path="/tasks" element={
                    <OrganizationProtectedRoute>
                      <DashboardLayout>
                        <div className="mt-4">
                          <h1 className="text-3xl font-bold mb-4">Tasks</h1>
                          <p className="text-muted-foreground">This page is coming soon.</p>
                        </div>
                      </DashboardLayout>
                    </OrganizationProtectedRoute>
                  } />
                  
                  <Route path="/medical-records" element={
                    <OrganizationProtectedRoute>
                      <DashboardLayout>
                        <div className="mt-4">
                          <h1 className="text-3xl font-bold mb-4">Medical Records</h1>
                          <p className="text-muted-foreground">This page is coming soon.</p>
                        </div>
                      </DashboardLayout>
                    </OrganizationProtectedRoute>
                  } />
                  
                  <Route path="/employees" element={
                    <OrganizationProtectedRoute>
                      <DashboardLayout>
                        <div className="mt-4">
                          <h1 className="text-3xl font-bold mb-4">Employees</h1>
                          <p className="text-muted-foreground">This page is coming soon.</p>
                        </div>
                      </DashboardLayout>
                    </OrganizationProtectedRoute>
                  } />
                  
                  <Route path="/reports" element={
                    <OrganizationProtectedRoute>
                      <DashboardLayout>
                        <div className="mt-4">
                          <h1 className="text-3xl font-bold mb-4">Reports</h1>
                          <p className="text-muted-foreground">This page is coming soon.</p>
                        </div>
                      </DashboardLayout>
                    </OrganizationProtectedRoute>
                  } />
                  
                  <Route path="/reports/compliance" element={
                    <OrganizationProtectedRoute>
                      <DashboardLayout>
                        <div className="mt-4">
                          <h1 className="text-3xl font-bold mb-4">Compliance Reports</h1>
                          <p className="text-muted-foreground">This page is coming soon.</p>
                        </div>
                      </DashboardLayout>
                    </OrganizationProtectedRoute>
                  } />
                  
                  <Route path="/analytics" element={
                    <OrganizationProtectedRoute>
                      <DashboardLayout>
                        <div className="mt-4">
                          <h1 className="text-3xl font-bold mb-4">Analytics</h1>
                          <p className="text-muted-foreground">This page is coming soon.</p>
                        </div>
                      </DashboardLayout>
                    </OrganizationProtectedRoute>
                  } />
                  
                  <Route path="/support" element={
                    <OrganizationProtectedRoute>
                      <DashboardLayout>
                        <div className="mt-4">
                          <h1 className="text-3xl font-bold mb-4">Help & Support</h1>
                          <p className="text-muted-foreground">This page is coming soon.</p>
                        </div>
                      </DashboardLayout>
                    </OrganizationProtectedRoute>
                  } />
                  
                  <Route path="/notifications" element={
                    <OrganizationProtectedRoute>
                      <DashboardLayout>
                        <div className="mt-4">
                          <h1 className="text-3xl font-bold mb-4">Notifications</h1>
                          <p className="text-muted-foreground">This page is coming soon.</p>
                        </div>
                      </DashboardLayout>
                    </OrganizationProtectedRoute>
                  } />
                  
                  {/* New Routes */}
                  <Route path="/compliance" element={
                    <OrganizationProtectedRoute>
                      <DashboardLayout>
                        <div className="mt-4">
                          <h1 className="text-3xl font-bold mb-4">Compliance Dashboard</h1>
                          <p className="text-muted-foreground">This page shows compliance metrics and statuses for your organization.</p>
                        </div>
                      </DashboardLayout>
                    </OrganizationProtectedRoute>
                  } />
                  
                  <Route path="/reports/analytics" element={
                    <OrganizationProtectedRoute>
                      <DashboardLayout>
                        <div className="mt-4">
                          <h1 className="text-3xl font-bold mb-4">Analytics Dashboard</h1>
                          <p className="text-muted-foreground">Detailed analytics and metrics for your organization.</p>
                        </div>
                      </DashboardLayout>
                    </OrganizationProtectedRoute>
                  } />
                  
                  {/* 404 Route */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
              <Toaster />
              <SonnerToaster position="top-right" />
            </OrganizationProvider>
          </AuthProvider>
        </BrowserRouter>
      </div>
    </QueryClientProvider>
  );
}

export default App;

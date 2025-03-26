
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { OrganizationProvider } from './contexts/OrganizationContext';
import Index from './pages/Index';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import NotFound from './pages/NotFound';
import HeaderComponent from './components/HeaderComponent';
import OrganizationProtectedRoute from './components/OrganizationProtectedRoute';
import FirstTimeSetupPage from './pages/FirstTimeSetupPage';
import DocumentViewer from './pages/DocumentViewer';
import ResetPasswordPage from './pages/ResetPasswordPage';
import UpdatePasswordPage from './pages/UpdatePasswordPage';
import AcceptInvitePage from './pages/AcceptInvitePage';
import { OrganizationsPage } from './pages/admin';
import { CreateOrganizationPage } from './pages/admin';
import { EditOrganizationPage } from './pages/admin';
import { OrganizationUsersPage } from './pages/admin';
import OrganizationClientsPage from './pages/admin/OrganizationClientsPage';
import OrganizationSettingsPage from './pages/settings/OrganizationSettingsPage';
import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from "sonner";
import { DashboardLayout } from './components/DashboardLayout';
import PatientsPage from './pages/PatientsPage';
import PatientDetailPage from './pages/PatientDetailPage';
import PatientRecordsPage from './pages/PatientRecordsPage';
import PatientEditPage from './pages/PatientEditPage';

// Create a client
const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="bg-gray-50 dark:bg-gray-950 min-h-screen">
        <BrowserRouter>
          <AuthProvider>
            <OrganizationProvider>
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
                  
                  <Route path="/documents/:id" element={
                    <OrganizationProtectedRoute>
                      <DashboardLayout>
                        <DocumentViewer />
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
                  
                  {/* Redirect for root preview */}
                  <Route path="index.html" element={<Navigate to="/" replace />} />
                  
                  {/* 404 Route - Should be the last route */}
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

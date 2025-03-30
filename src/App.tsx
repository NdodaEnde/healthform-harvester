import React, { useState, useEffect } from 'react';
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
import LoadingFallback from './components/LoadingFallback';
import AnalyticsDashboardPage from './pages/AnalyticsDashboardPage';

// Create a client
const queryClient = new QueryClient();

// Helper to detect preview mode
const isInPreviewMode = () => {
  const url = window.location.href;
  return url.includes('/preview') || url.includes('preview=true');
};

function App() {
  const [isInitializing, setIsInitializing] = useState(true);
  const inPreviewMode = isInPreviewMode();

  // Simulate a brief initialization to prevent flash of 404
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitializing(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Log information about the current environment
  useEffect(() => {
    console.log(`App initializing. Preview mode: ${inPreviewMode ? 'Yes' : 'No'}`);
    console.log(`Current URL: ${window.location.href}`);
    console.log(`Current pathname: ${window.location.pathname}`);
  }, [inPreviewMode]);
  
  // Show loading state during initial render to prevent flash of 404
  if (isInitializing) {
    return <LoadingFallback />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <div className="bg-gray-50 dark:bg-gray-950 min-h-screen">
        <BrowserRouter basename={process.env.NODE_ENV === 'production' ? '/' : '/'}>
          <AuthProvider>
            <OrganizationProvider>
              <HeaderComponent />
              <main className="relative">
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
                  <Route path="/auth/update-password" element={<UpdatePasswordPage />} />
                  <Route path="/auth/accept-invite" element={<AcceptInvitePage />} />
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
                  
                  {/* Analytics Dashboard */}
                  <Route path="/analytics" element={
                    <OrganizationProtectedRoute>
                      <DashboardLayout>
                        <AnalyticsDashboardPage />
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

                  {/* Document URL format correction */}
                  <Route path="/document/:id" element={
                    <Navigate to={`/documents/${window.location.pathname.split('/').pop()}`} replace />
                  } />
                  
                  {/* 404 Route - needs to be last */}
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

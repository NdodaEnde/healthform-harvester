
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
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
import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from "sonner";

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
              <main className="pt-16 pb-8">
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/reset-password" element={<ResetPasswordPage />} />
                  <Route path="/update-password" element={<UpdatePasswordPage />} />
                  <Route path="/accept-invite" element={<AcceptInvitePage />} />
                  
                  {/* Organization Management */}
                  <Route path="/admin/organizations" element={
                    <OrganizationProtectedRoute>
                      <OrganizationsPage />
                    </OrganizationProtectedRoute>
                  } />
                  <Route path="/admin/organizations/new" element={
                    <OrganizationProtectedRoute>
                      <CreateOrganizationPage />
                    </OrganizationProtectedRoute>
                  } />
                  <Route path="/admin/organizations/:id/edit" element={
                    <OrganizationProtectedRoute>
                      <EditOrganizationPage />
                    </OrganizationProtectedRoute>
                  } />
                  <Route path="/admin/organizations/:id/users" element={
                    <OrganizationProtectedRoute>
                      <OrganizationUsersPage />
                    </OrganizationProtectedRoute>
                  } />
                  
                  {/* Protected Routes */}
                  <Route path="/dashboard" element={
                    <OrganizationProtectedRoute>
                      <Dashboard />
                    </OrganizationProtectedRoute>
                  } />
                  <Route path="/setup" element={<FirstTimeSetupPage />} />
                  
                  {/* Document Viewer - Ensure this route is correctly defined */}
                  <Route path="/documents/:id" element={
                    <OrganizationProtectedRoute>
                      <DocumentViewer />
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

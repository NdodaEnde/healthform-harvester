
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/AuthContext';
import { OrganizationProvider } from '@/contexts/OrganizationContext';
import { PackageProvider } from '@/contexts/PackageContext';
import Layout from '@/components/Layout';
import Index from '@/pages/Index';
import Auth from '@/pages/Auth';
import Dashboard from '@/pages/Dashboard';
import OrganizationsListPage from '@/pages/OrganizationsListPage';
import DocumentsPage from '@/pages/DocumentsPage';
import PatientsPage from '@/pages/PatientsPage';
import SettingsPage from '@/pages/settings/SettingsPage';
import StructuredExtractionPage from '@/pages/StructuredExtractionPage';
import OrganizationProtectedRoute from '@/components/OrganizationProtectedRoute';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      gcTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <OrganizationProvider>
            <PackageProvider>
              <div className="min-h-screen bg-background">
                <Routes>
                  {/* Public routes */}
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<Auth />} />
                  
                  {/* Protected routes */}
                  <Route path="/dashboard" element={
                    <OrganizationProtectedRoute>
                      <Layout>
                        <Dashboard />
                      </Layout>
                    </OrganizationProtectedRoute>
                  } />
                  
                  <Route path="/organizations" element={
                    <OrganizationProtectedRoute>
                      <Layout>
                        <OrganizationsListPage />
                      </Layout>
                    </OrganizationProtectedRoute>
                  } />
                  
                  <Route path="/documents" element={
                    <OrganizationProtectedRoute>
                      <Layout>
                        <DocumentsPage />
                      </Layout>
                    </OrganizationProtectedRoute>
                  } />
                  
                  <Route path="/patients" element={
                    <OrganizationProtectedRoute>
                      <Layout>
                        <PatientsPage />
                      </Layout>
                    </OrganizationProtectedRoute>
                  } />
                  
                  <Route path="/structured-extraction" element={
                    <OrganizationProtectedRoute>
                      <Layout>
                        <StructuredExtractionPage />
                      </Layout>
                    </OrganizationProtectedRoute>
                  } />
                  
                  <Route path="/settings" element={
                    <OrganizationProtectedRoute>
                      <Layout>
                        <SettingsPage />
                      </Layout>
                    </OrganizationProtectedRoute>
                  } />
                  
                  {/* Redirect unknown routes to dashboard */}
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </div>
              <Toaster />
            </PackageProvider>
          </OrganizationProvider>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;

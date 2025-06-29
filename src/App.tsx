
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/AuthContext';
import { OrganizationProvider } from '@/contexts/OrganizationContext';
import { PackageProvider } from '@/contexts/PackageContext';
import Layout from '@/components/Layout';
import HomePage from '@/pages/HomePage';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import DashboardPage from '@/pages/DashboardPage';
import OrganizationsPage from '@/pages/OrganizationsPage';
import DocumentsPage from '@/pages/DocumentsPage';
import PatientsPage from '@/pages/PatientsPage';
import SettingsPage from '@/pages/settings/SettingsPage';
import StructuredExtractionPage from '@/pages/StructuredExtractionPage';
import ProtectedRoute from '@/components/ProtectedRoute';

function App() {
  return (
    <Router>
      <AuthProvider>
        <OrganizationProvider>
          <PackageProvider>
            <div className="min-h-screen bg-background">
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                
                {/* Protected routes */}
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <Layout>
                      <DashboardPage />
                    </Layout>
                  </ProtectedRoute>
                } />
                
                <Route path="/organizations" element={
                  <ProtectedRoute>
                    <Layout>
                      <OrganizationsPage />
                    </Layout>
                  </ProtectedRoute>
                } />
                
                <Route path="/documents" element={
                  <ProtectedRoute>
                    <Layout>
                      <DocumentsPage />
                    </Layout>
                  </ProtectedRoute>
                } />
                
                <Route path="/patients" element={
                  <ProtectedRoute>
                    <Layout>
                      <PatientsPage />
                    </Layout>
                  </ProtectedRoute>
                } />
                
                <Route path="/structured-extraction" element={
                  <ProtectedRoute>
                    <Layout>
                      <StructuredExtractionPage />
                    </Layout>
                  </ProtectedRoute>
                } />
                
                <Route path="/settings" element={
                  <ProtectedRoute>
                    <Layout>
                      <SettingsPage />
                    </Layout>
                  </ProtectedRoute>
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
  );
}

export default App;

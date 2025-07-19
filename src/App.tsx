
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from '@/contexts/AuthContext';
import { OrganizationProvider } from '@/contexts/OrganizationContext';
import { PackageProvider } from '@/contexts/PackageContext';
import OrganizationProtectedRoute from '@/components/OrganizationProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import HeaderComponent from '@/components/HeaderComponent';
import Index from '@/pages/Index';
import Dashboard from '@/pages/Dashboard';
import AnalyticsPage from './pages/analytics/AnalyticsPage';
import ClinicalAnalyticsPage from './pages/analytics/ClinicalAnalyticsPage';
import IntegratedOccupationalHealthPage from './pages/analytics/IntegratedOccupationalHealthPage';
import ReportsPage from './pages/ReportsPage';
import CertificateTemplatesPage from './pages/certificates/CertificateTemplatesPage';
import CertificatesPage from './pages/certificates/CertificatesPage';
import EmployeesPage from './pages/employees/EmployeesPage';
import OnboardingPage from './pages/onboarding/OnboardingPage';
import TierTestingPage from './pages/TierTestingPage';
import Auth from './pages/Auth';
import PatientsPage from './pages/PatientsPage';
import PatientDetailPage from './pages/PatientDetailPage';
import DocumentsPage from './pages/DocumentsPage';
import DocumentViewer from './pages/DocumentViewer';
import OrganizationSettingsPage from './pages/settings/OrganizationSettingsPage';
import FirstTimeSetupPage from './pages/FirstTimeSetupPage';
import { OrganizationsPage, CreateOrganizationPage, EditOrganizationPage, OrganizationUsersPage, OrganizationClientsPage } from './pages/admin';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
        <AuthProvider>
          <OrganizationProvider>
            <PackageProvider>
              <Router>
                <div className="min-h-screen bg-background">
                  <Routes>
                    {/* Public routes */}
                    <Route path="/" element={
                      <>
                        <HeaderComponent />
                        <Index />
                      </>
                    } />
                    <Route path="/auth" element={
                      <>
                        <HeaderComponent />
                        <Auth />
                      </>
                    } />
                    <Route path="/setup" element={
                      <OrganizationProtectedRoute>
                        <HeaderComponent />
                        <FirstTimeSetupPage />
                      </OrganizationProtectedRoute>
                    } />
                    
                    {/* All dashboard routes are now protected */}
                    <Route path="/dashboard" element={
                      <OrganizationProtectedRoute>
                        <HeaderComponent />
                        <DashboardLayout>
                          <Dashboard />
                        </DashboardLayout>
                      </OrganizationProtectedRoute>
                    } />
                    <Route path="/analytics" element={
                      <OrganizationProtectedRoute>
                        <HeaderComponent />
                        <DashboardLayout>
                          <AnalyticsPage />
                        </DashboardLayout>
                      </OrganizationProtectedRoute>
                    } />
                    <Route path="/clinical-analytics" element={
                      <OrganizationProtectedRoute>
                        <HeaderComponent />
                        <DashboardLayout>
                          <ClinicalAnalyticsPage />
                        </DashboardLayout>
                      </OrganizationProtectedRoute>
                    } />
                    <Route path="/integrated-occupational-health" element={
                      <OrganizationProtectedRoute>
                        <HeaderComponent />
                        <DashboardLayout>
                          <IntegratedOccupationalHealthPage />
                        </DashboardLayout>
                      </OrganizationProtectedRoute>
                    } />
                    <Route path="/patients" element={
                      <OrganizationProtectedRoute>
                        <HeaderComponent />
                        <DashboardLayout>
                          <PatientsPage />
                        </DashboardLayout>
                      </OrganizationProtectedRoute>
                    } />
                    <Route path="/patients/:id" element={
                      <OrganizationProtectedRoute>
                        <HeaderComponent />
                        <DashboardLayout>
                          <PatientDetailPage />
                        </DashboardLayout>
                      </OrganizationProtectedRoute>
                    } />
                    <Route path="/patients/:id/edit" element={
                      <OrganizationProtectedRoute>
                        <HeaderComponent />
                        <DashboardLayout>
                          <PatientDetailPage />
                        </DashboardLayout>
                      </OrganizationProtectedRoute>
                    } />
                    <Route path="/patients/new" element={
                      <OrganizationProtectedRoute>
                        <HeaderComponent />
                        <DashboardLayout>
                          <PatientsPage />
                        </DashboardLayout>
                      </OrganizationProtectedRoute>
                    } />
                    <Route path="/documents" element={
                      <OrganizationProtectedRoute>
                        <HeaderComponent />
                        <DashboardLayout>
                          <DocumentsPage />
                        </DashboardLayout>
                      </OrganizationProtectedRoute>
                    } />
                    <Route path="/documents/:id" element={
                      <OrganizationProtectedRoute>
                        <HeaderComponent />
                        <DashboardLayout>
                          <DocumentViewer />
                        </DashboardLayout>
                      </OrganizationProtectedRoute>
                    } />
                    <Route path="/reports" element={
                      <OrganizationProtectedRoute>
                        <HeaderComponent />
                        <DashboardLayout>
                          <ReportsPage />
                        </DashboardLayout>
                      </OrganizationProtectedRoute>
                    } />
                    <Route path="/settings" element={
                      <OrganizationProtectedRoute>
                        <HeaderComponent />
                        <DashboardLayout>
                          <OrganizationSettingsPage />
                        </DashboardLayout>
                      </OrganizationProtectedRoute>
                    } />
                    <Route path="/settings/organization" element={
                      <OrganizationProtectedRoute>
                        <HeaderComponent />
                        <DashboardLayout>
                          <OrganizationSettingsPage />
                        </DashboardLayout>
                      </OrganizationProtectedRoute>
                    } />
                    <Route path="/certificates" element={
                      <OrganizationProtectedRoute>
                        <HeaderComponent />
                        <DashboardLayout>
                          <CertificatesPage />
                        </DashboardLayout>
                      </OrganizationProtectedRoute>
                    } />
                    <Route path="/certificates/templates" element={
                      <OrganizationProtectedRoute>
                        <HeaderComponent />
                        <DashboardLayout>
                          <CertificateTemplatesPage />
                        </DashboardLayout>
                      </OrganizationProtectedRoute>
                    } />
                    <Route path="/employees" element={
                      <OrganizationProtectedRoute>
                        <HeaderComponent />
                        <DashboardLayout>
                          <EmployeesPage />
                        </DashboardLayout>
                      </OrganizationProtectedRoute>
                    } />
                    <Route path="/onboarding" element={
                      <OrganizationProtectedRoute>
                        <HeaderComponent />
                        <DashboardLayout>
                          <OnboardingPage />
                        </DashboardLayout>
                      </OrganizationProtectedRoute>
                    } />
                    <Route path="/tier-testing" element={
                      <OrganizationProtectedRoute>
                        <HeaderComponent />
                        <DashboardLayout>
                          <TierTestingPage />
                        </DashboardLayout>
                      </OrganizationProtectedRoute>
                    } />
                    <Route path="/testing" element={
                      <OrganizationProtectedRoute>
                        <HeaderComponent />
                        <DashboardLayout>
                          <TierTestingPage />
                        </DashboardLayout>
                      </OrganizationProtectedRoute>
                    } />
                    <Route path="/admin/organizations" element={
                      <OrganizationProtectedRoute>
                        <HeaderComponent />
                        <DashboardLayout>
                          <OrganizationsPage />
                        </DashboardLayout>
                      </OrganizationProtectedRoute>
                    } />
                    <Route path="/admin/organizations/new" element={
                      <OrganizationProtectedRoute>
                        <HeaderComponent />
                        <DashboardLayout>
                          <CreateOrganizationPage />
                        </DashboardLayout>
                      </OrganizationProtectedRoute>
                    } />
                    <Route path="/admin/organizations/:id/edit" element={
                      <OrganizationProtectedRoute>
                        <HeaderComponent />
                        <DashboardLayout>
                          <EditOrganizationPage />
                        </DashboardLayout>
                      </OrganizationProtectedRoute>
                    } />
                    <Route path="/admin/organizations/:orgId/clients" element={
                      <OrganizationProtectedRoute>
                        <HeaderComponent />
                        <DashboardLayout>
                          <OrganizationClientsPage />
                        </DashboardLayout>
                      </OrganizationProtectedRoute>
                    } />
                    <Route path="/admin/organizations/:id/users" element={
                      <OrganizationProtectedRoute>
                        <HeaderComponent />
                        <DashboardLayout>
                          <OrganizationUsersPage />
                        </DashboardLayout>
                      </OrganizationProtectedRoute>
                    } />
                    <Route path="/admin/users" element={
                      <OrganizationProtectedRoute>
                        <HeaderComponent />
                        <DashboardLayout>
                          <OrganizationUsersPage />
                        </DashboardLayout>
                      </OrganizationProtectedRoute>
                    } />
                  </Routes>
                  <Toaster />
                </div>
              </Router>
            </PackageProvider>
          </OrganizationProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;

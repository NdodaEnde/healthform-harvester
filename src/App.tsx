
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from '@/contexts/AuthContext';
import { OrganizationProvider } from '@/contexts/OrganizationContext';
import { PackageProvider } from '@/contexts/PackageContext';
import DashboardLayout from '@/components/DashboardLayout';
import HeaderComponent from '@/components/HeaderComponent';
import ProtectedRoute from '@/components/ProtectedRoute';
import OrganizationProtectedRoute from '@/components/OrganizationProtectedRoute';
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
                  <HeaderComponent />
                  <Routes>
                    {/* Public routes */}
                    <Route path="/" element={<Index />} />
                    <Route path="/auth" element={<Auth />} />
                    
                    {/* Protected dashboard routes with sidebar */}
                    <Route path="/dashboard" element={
                      <ProtectedRoute>
                        <OrganizationProtectedRoute>
                          <DashboardLayout>
                            <Dashboard />
                          </DashboardLayout>
                        </OrganizationProtectedRoute>
                      </ProtectedRoute>
                    } />
                    <Route path="/analytics" element={
                      <ProtectedRoute>
                        <OrganizationProtectedRoute>
                          <DashboardLayout>
                            <AnalyticsPage />
                          </DashboardLayout>
                        </OrganizationProtectedRoute>
                      </ProtectedRoute>
                    } />
                    <Route path="/clinical-analytics" element={
                      <ProtectedRoute>
                        <OrganizationProtectedRoute>
                          <DashboardLayout>
                            <ClinicalAnalyticsPage />
                          </DashboardLayout>
                        </OrganizationProtectedRoute>
                      </ProtectedRoute>
                    } />
                    <Route path="/integrated-occupational-health" element={
                      <ProtectedRoute>
                        <OrganizationProtectedRoute>
                          <DashboardLayout>
                            <IntegratedOccupationalHealthPage />
                          </DashboardLayout>
                        </OrganizationProtectedRoute>
                      </ProtectedRoute>
                    } />
                    <Route path="/patients" element={
                      <ProtectedRoute>
                        <OrganizationProtectedRoute>
                          <DashboardLayout>
                            <PatientsPage />
                          </DashboardLayout>
                        </OrganizationProtectedRoute>
                      </ProtectedRoute>
                    } />
                    <Route path="/patients/:id" element={
                      <ProtectedRoute>
                        <OrganizationProtectedRoute>
                          <DashboardLayout>
                            <PatientDetailPage />
                          </DashboardLayout>
                        </OrganizationProtectedRoute>
                      </ProtectedRoute>
                    } />
                    <Route path="/patients/:id/edit" element={
                      <ProtectedRoute>
                        <OrganizationProtectedRoute>
                          <DashboardLayout>
                            <PatientDetailPage />
                          </DashboardLayout>
                        </OrganizationProtectedRoute>
                      </ProtectedRoute>
                    } />
                    <Route path="/patients/new" element={
                      <ProtectedRoute>
                        <OrganizationProtectedRoute>
                          <DashboardLayout>
                            <PatientsPage />
                          </DashboardLayout>
                        </OrganizationProtectedRoute>
                      </ProtectedRoute>
                    } />
                    <Route path="/documents" element={
                      <ProtectedRoute>
                        <OrganizationProtectedRoute>
                          <DashboardLayout>
                            <DocumentsPage />
                          </DashboardLayout>
                        </OrganizationProtectedRoute>
                      </ProtectedRoute>
                    } />
                    <Route path="/documents/:id" element={
                      <ProtectedRoute>
                        <OrganizationProtectedRoute>
                          <DashboardLayout>
                            <DocumentViewer />
                          </DashboardLayout>
                        </OrganizationProtectedRoute>
                      </ProtectedRoute>
                    } />
                    <Route path="/reports" element={
                      <ProtectedRoute>
                        <OrganizationProtectedRoute>
                          <DashboardLayout>
                            <ReportsPage />
                          </DashboardLayout>
                        </OrganizationProtectedRoute>
                      </ProtectedRoute>
                    } />
                    <Route path="/settings" element={
                      <ProtectedRoute>
                        <OrganizationProtectedRoute>
                          <DashboardLayout>
                            <OrganizationSettingsPage />
                          </DashboardLayout>
                        </OrganizationProtectedRoute>
                      </ProtectedRoute>
                    } />
                    <Route path="/settings/organization" element={
                      <ProtectedRoute>
                        <OrganizationProtectedRoute>
                          <DashboardLayout>
                            <OrganizationSettingsPage />
                          </DashboardLayout>
                        </OrganizationProtectedRoute>
                      </ProtectedRoute>
                    } />
                    <Route path="/certificates" element={
                      <ProtectedRoute>
                        <OrganizationProtectedRoute>
                          <DashboardLayout>
                            <CertificatesPage />
                          </DashboardLayout>
                        </OrganizationProtectedRoute>
                      </ProtectedRoute>
                    } />
                    <Route path="/certificates/templates" element={
                      <ProtectedRoute>
                        <OrganizationProtectedRoute>
                          <DashboardLayout>
                            <CertificateTemplatesPage />
                          </DashboardLayout>
                        </OrganizationProtectedRoute>
                      </ProtectedRoute>
                    } />
                    <Route path="/employees" element={
                      <ProtectedRoute>
                        <OrganizationProtectedRoute>
                          <DashboardLayout>
                            <EmployeesPage />
                          </DashboardLayout>
                        </OrganizationProtectedRoute>
                      </ProtectedRoute>
                    } />
                    <Route path="/onboarding" element={
                      <ProtectedRoute>
                        <OrganizationProtectedRoute>
                          <DashboardLayout>
                            <OnboardingPage />
                          </DashboardLayout>
                        </OrganizationProtectedRoute>
                      </ProtectedRoute>
                    } />
                    <Route path="/tier-testing" element={
                      <ProtectedRoute>
                        <OrganizationProtectedRoute>
                          <DashboardLayout>
                            <TierTestingPage />
                          </DashboardLayout>
                        </OrganizationProtectedRoute>
                      </ProtectedRoute>
                    } />
                    <Route path="/testing" element={
                      <ProtectedRoute>
                        <OrganizationProtectedRoute>
                          <DashboardLayout>
                            <TierTestingPage />
                          </DashboardLayout>
                        </OrganizationProtectedRoute>
                      </ProtectedRoute>
                    } />
                    <Route path="/admin/organizations" element={
                      <ProtectedRoute>
                        <OrganizationProtectedRoute>
                          <DashboardLayout>
                            <OrganizationsPage />
                          </DashboardLayout>
                        </OrganizationProtectedRoute>
                      </ProtectedRoute>
                    } />
                    <Route path="/admin/organizations/new" element={
                      <ProtectedRoute>
                        <OrganizationProtectedRoute>
                          <DashboardLayout>
                            <CreateOrganizationPage />
                          </DashboardLayout>
                        </OrganizationProtectedRoute>
                      </ProtectedRoute>
                    } />
                    <Route path="/admin/organizations/:id/edit" element={
                      <ProtectedRoute>
                        <OrganizationProtectedRoute>
                          <DashboardLayout>
                            <EditOrganizationPage />
                          </DashboardLayout>
                        </OrganizationProtectedRoute>
                      </ProtectedRoute>
                    } />
                    <Route path="/admin/organizations/:orgId/clients" element={
                      <ProtectedRoute>
                        <OrganizationProtectedRoute>
                          <DashboardLayout>
                            <OrganizationClientsPage />
                          </DashboardLayout>
                        </OrganizationProtectedRoute>
                      </ProtectedRoute>
                    } />
                    <Route path="/admin/organizations/:id/users" element={
                      <ProtectedRoute>
                        <OrganizationProtectedRoute>
                          <DashboardLayout>
                            <OrganizationUsersPage />
                          </DashboardLayout>
                        </OrganizationProtectedRoute>
                      </ProtectedRoute>
                    } />
                    <Route path="/admin/users" element={
                      <ProtectedRoute>
                        <OrganizationProtectedRoute>
                          <DashboardLayout>
                            <OrganizationUsersPage />
                          </DashboardLayout>
                        </OrganizationProtectedRoute>
                      </ProtectedRoute>
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

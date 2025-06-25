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
                    
                    {/* Dashboard routes with sidebar */}
                    <Route path="/dashboard" element={
                      <DashboardLayout>
                        <Dashboard />
                      </DashboardLayout>
                    } />
                    <Route path="/analytics" element={
                      <DashboardLayout>
                        <AnalyticsPage />
                      </DashboardLayout>
                    } />
                    <Route path="/clinical-analytics" element={
                      <DashboardLayout>
                        <ClinicalAnalyticsPage />
                      </DashboardLayout>
                    } />
                    <Route path="/integrated-occupational-health" element={
                      <DashboardLayout>
                        <IntegratedOccupationalHealthPage />
                      </DashboardLayout>
                    } />
                    <Route path="/patients" element={
                      <DashboardLayout>
                        <PatientsPage />
                      </DashboardLayout>
                    } />
                    <Route path="/patients/:id" element={
                      <DashboardLayout>
                        <PatientDetailPage />
                      </DashboardLayout>
                    } />
                    <Route path="/patients/:id/edit" element={
                      <DashboardLayout>
                        <PatientDetailPage />
                      </DashboardLayout>
                    } />
                    <Route path="/patients/new" element={
                      <DashboardLayout>
                        <PatientsPage />
                      </DashboardLayout>
                    } />
                    <Route path="/documents" element={
                      <DashboardLayout>
                        <DocumentsPage />
                      </DashboardLayout>
                    } />
                    <Route path="/documents/:id" element={
                      <DashboardLayout>
                        <DocumentViewer />
                      </DashboardLayout>
                    } />
                    <Route path="/reports" element={
                      <DashboardLayout>
                        <ReportsPage />
                      </DashboardLayout>
                    } />
                    <Route path="/settings" element={
                      <DashboardLayout>
                        <OrganizationSettingsPage />
                      </DashboardLayout>
                    } />
                    <Route path="/settings/organization" element={
                      <DashboardLayout>
                        <OrganizationSettingsPage />
                      </DashboardLayout>
                    } />
                    <Route path="/certificates" element={
                      <DashboardLayout>
                        <CertificatesPage />
                      </DashboardLayout>
                    } />
                    <Route path="/certificates/templates" element={
                      <DashboardLayout>
                        <CertificateTemplatesPage />
                      </DashboardLayout>
                    } />
                    <Route path="/employees" element={
                      <DashboardLayout>
                        <EmployeesPage />
                      </DashboardLayout>
                    } />
                    <Route path="/onboarding" element={
                      <DashboardLayout>
                        <OnboardingPage />
                      </DashboardLayout>
                    } />
                    <Route path="/tier-testing" element={
                      <DashboardLayout>
                        <TierTestingPage />
                      </DashboardLayout>
                    } />
                    <Route path="/testing" element={
                      <DashboardLayout>
                        <TierTestingPage />
                      </DashboardLayout>
                    } />
                    <Route path="/admin/organizations" element={
                      <DashboardLayout>
                        <OrganizationsPage />
                      </DashboardLayout>
                    } />
                    <Route path="/admin/organizations/new" element={
                      <DashboardLayout>
                        <CreateOrganizationPage />
                      </DashboardLayout>
                    } />
                    <Route path="/admin/organizations/:id/edit" element={
                      <DashboardLayout>
                        <EditOrganizationPage />
                      </DashboardLayout>
                    } />
                    <Route path="/admin/organizations/:orgId/clients" element={
                      <DashboardLayout>
                        <OrganizationClientsPage />
                      </DashboardLayout>
                    } />
                    <Route path="/admin/organizations/:id/users" element={
                      <DashboardLayout>
                        <OrganizationUsersPage />
                      </DashboardLayout>
                    } />
                    <Route path="/admin/users" element={
                      <DashboardLayout>
                        <OrganizationUsersPage />
                      </DashboardLayout>
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

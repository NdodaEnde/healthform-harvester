
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import AnalyticsPage from './pages/analytics/AnalyticsPage';
import SettingsPage from './pages/settings/SettingsPage';
import CertificatesPage from './pages/certificates/CertificatesPage';
import EmployeesPage from './pages/employees/EmployeesPage';
import OnboardingPage from './pages/onboarding/OnboardingPage';
import { OrganizationProvider } from '@/contexts/OrganizationContext';
import { PackageProvider } from '@/contexts/PackageContext';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
        <OrganizationProvider>
          <PackageProvider>
            <Router>
              <div className="min-h-screen bg-background">
                <Routes>
                  <Route path="/" element={<AnalyticsPage />} />
                  <Route path="/analytics" element={<AnalyticsPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/certificates" element={<CertificatesPage />} />
                  <Route path="/employees" element={<EmployeesPage />} />
                  <Route path="/onboarding" element={<OnboardingPage />} />
                </Routes>
                <Toaster />
              </div>
            </Router>
          </PackageProvider>
        </OrganizationProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;

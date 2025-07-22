import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Index from "@/pages/Index";
import Auth from "@/pages/Auth";
import Dashboard from "@/pages/Dashboard";
import PatientsPage from "@/pages/PatientsPage";
import PatientDetailPage from "@/pages/PatientDetailPage";
import PatientEditPage from "@/pages/PatientEditPage";
import DocumentsPage from "@/pages/DocumentsPage";
import DocumentAnalyticsPage from "@/pages/documents/DocumentAnalyticsPage";
import DocumentViewer from "@/pages/DocumentViewer";
import AnalyticsPage from "@/pages/analytics/AnalyticsPage";
import PatientRecordsPage from "@/pages/PatientRecordsPage";
import ReportsPage from "@/pages/ReportsPage";
import AuthCallback from "@/pages/AuthCallback";
import AcceptInvitePage from "@/pages/AcceptInvitePage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import UpdatePasswordPage from "@/pages/UpdatePasswordPage";
import FirstTimeSetupPage from "@/pages/FirstTimeSetupPage";
import OrganizationsListPage from "@/pages/OrganizationsListPage";
import NotFound from "@/pages/NotFound";
import TierTestingPage from "@/pages/TierTestingPage";
import OrganizationProtectedRoute from "@/components/OrganizationProtectedRoute";
import LoadingFallback from "@/components/LoadingFallback";
import { Suspense } from "react";

import { AuthProvider } from "@/contexts/AuthContext";
import { OrganizationProvider } from "@/contexts/OrganizationContext";
import { PackageProvider } from "@/contexts/PackageContext";
import SettingsPage from "@/pages/settings/SettingsPage";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <AuthProvider>
            <OrganizationProvider>
              <PackageProvider>
                <Router>
                  <div className="min-h-screen bg-background">
                    <Suspense fallback={<LoadingFallback />}>
                      <Routes>
                        <Route path="/" element={<Index />} />
                        <Route path="/auth" element={<Auth />} />
                        <Route path="/auth/callback" element={<AuthCallback />} />
                        <Route path="/accept-invite" element={<AcceptInvitePage />} />
                        <Route path="/reset-password" element={<ResetPasswordPage />} />
                        <Route path="/update-password" element={<UpdatePasswordPage />} />
                        <Route path="/first-time-setup" element={<FirstTimeSetupPage />} />
                        <Route path="/tier-testing" element={<TierTestingPage />} />

                        <Route path="/dashboard" element={
                          <OrganizationProtectedRoute>
                            <Dashboard />
                          </OrganizationProtectedRoute>
                        } />

                        <Route path="/patients" element={
                          <OrganizationProtectedRoute>
                            <PatientsPage />
                          </OrganizationProtectedRoute>
                        } />
                        <Route path="/patients/:patientId" element={
                          <OrganizationProtectedRoute>
                            <PatientDetailPage />
                          </OrganizationProtectedRoute>
                        } />
                        <Route path="/patients/:patientId/edit" element={
                          <OrganizationProtectedRoute>
                            <PatientEditPage />
                          </OrganizationProtectedRoute>
                        } />

                        <Route path="/patient-records" element={
                          <OrganizationProtectedRoute>
                            <PatientRecordsPage />
                          </OrganizationProtectedRoute>
                        } />

                        <Route path="/documents" element={
                          <OrganizationProtectedRoute>
                            <DocumentsPage />
                          </OrganizationProtectedRoute>
                        } />

                        <Route path="/documents/analytics" element={
                          <OrganizationProtectedRoute>
                            <DocumentAnalyticsPage />
                          </OrganizationProtectedRoute>
                        } />

                        <Route path="/document-viewer/:documentId" element={
                          <OrganizationProtectedRoute>
                            <DocumentViewer />
                          </OrganizationProtectedRoute>
                        } />

                        <Route path="/analytics" element={
                          <OrganizationProtectedRoute>
                            <AnalyticsPage />
                          </OrganizationProtectedRoute>
                        } />

                        <Route path="/reports" element={
                          <OrganizationProtectedRoute>
                            <ReportsPage />
                          </OrganizationProtectedRoute>
                        } />

                        <Route path="/organizations" element={
                          <OrganizationProtectedRoute>
                            <OrganizationsListPage />
                          </OrganizationProtectedRoute>
                        } />

                        <Route path="/settings" element={
                          <OrganizationProtectedRoute>
                            <SettingsPage />
                          </OrganizationProtectedRoute>
                        } />

                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </Suspense>
                  </div>
                </Router>
              </PackageProvider>
            </OrganizationProvider>
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;


import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { OrganizationProvider } from "@/contexts/OrganizationContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import DocumentsPage from "./pages/DocumentsPage";
import PatientsPage from "./pages/PatientsPage";
import Settings from "./pages/Settings";
import AnalyticsPage from "./pages/analytics/AnalyticsPage";
import ClinicalAnalyticsPage from "./pages/analytics/ClinicalAnalyticsPage";
import IntegratedOccupationalHealthPage from "./pages/analytics/IntegratedOccupationalHealthPage";
import ReportsPage from "./pages/ReportsPage";
import CertificateTemplatesPage from "./pages/certificates/CertificateTemplatesPage";
import OrganizationsPage from "./pages/admin/OrganizationsPage";
import OrganizationUsersPage from "./pages/admin/OrganizationUsersPage";
import OrganizationClientsPage from "./pages/admin/OrganizationClientsPage";
import AcceptInvitePage from "./pages/AcceptInvitePage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import UpdatePasswordPage from "./pages/UpdatePasswordPage";
import CompoundDocumentAnalyticsPage from "./pages/analytics/CompoundDocumentAnalyticsPage";
import CompoundDocumentsPage from "./pages/CompoundDocumentsPage";
import CompoundDocumentDetailPage from "./pages/CompoundDocumentDetailPage";
import OrganizationProtectedRoute from "./components/OrganizationProtectedRoute";
import DashboardLayout from "./components/DashboardLayout";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <BrowserRouter>
            <AuthProvider>
              <OrganizationProvider>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/accept-invite" element={<AcceptInvitePage />} />
                  <Route path="/reset-password" element={<ResetPasswordPage />} />
                  <Route path="/update-password" element={<UpdatePasswordPage />} />
                  
                  <Route element={<OrganizationProtectedRoute><DashboardLayout /></OrganizationProtectedRoute>}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/documents" element={<DocumentsPage />} />
                    <Route path="/patients" element={<PatientsPage />} />
                    <Route path="/analytics" element={<AnalyticsPage />} />
                    <Route path="/clinical-analytics" element={<ClinicalAnalyticsPage />} />
                    <Route path="/integrated-occupational-health" element={<IntegratedOccupationalHealthPage />} />
                    <Route path="/reports" element={<ReportsPage />} />
                    <Route path="/certificates/templates" element={<CertificateTemplatesPage />} />
                    <Route path="/admin/organizations" element={<OrganizationsPage />} />
                    <Route path="/admin/users" element={<OrganizationUsersPage />} />
                    <Route path="/admin/organizations/:organizationId/clients" element={<OrganizationClientsPage />} />
                    <Route path="/settings" element={<Settings />} />
                    
                    {/* Compound Documents Routes */}
                    <Route path="/compound-documents" element={<CompoundDocumentsPage />} />
                    <Route path="/compound-documents/:id" element={<CompoundDocumentDetailPage />} />
                    <Route path="/analytics/compound-documents" element={<CompoundDocumentAnalyticsPage />} />
                  </Route>
                  
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
                <Toaster />
                <Sonner />
              </OrganizationProvider>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;


import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { OrganizationProvider } from "@/contexts/OrganizationContext";
import { ThemeProvider } from "next-themes";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Documents from "./pages/Documents";
import Patients from "./pages/Patients";
import Settings from "./pages/Settings";
import Analytics from "./pages/Analytics";
import ClinicalAnalytics from "./pages/ClinicalAnalytics";
import IntegratedOccupationalHealth from "./pages/IntegratedOccupationalHealth";
import Reports from "./pages/Reports";
import CertificateTemplates from "./pages/CertificateTemplates";
import Organizations from "./pages/admin/Organizations";
import Users from "./pages/admin/Users";
import ClientOrganizations from "./pages/admin/ClientOrganizations";
import AcceptInvite from "./pages/AcceptInvite";
import ResetPassword from "./pages/ResetPassword";
import UpdatePassword from "./pages/UpdatePassword";
import CompoundDocumentAnalyticsPage from "./pages/analytics/CompoundDocumentAnalyticsPage";
import CompoundDocumentsPage from "./pages/CompoundDocumentsPage";
import CompoundDocumentDetailPage from "./pages/CompoundDocumentDetailPage";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardLayout from "./components/DashboardLayout";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light">
        <TooltipProvider>
          <BrowserRouter>
            <AuthProvider>
              <OrganizationProvider>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/accept-invite" element={<AcceptInvite />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/update-password" element={<UpdatePassword />} />
                  
                  <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/documents" element={<Documents />} />
                    <Route path="/patients" element={<Patients />} />
                    <Route path="/analytics" element={<Analytics />} />
                    <Route path="/clinical-analytics" element={<ClinicalAnalytics />} />
                    <Route path="/integrated-occupational-health" element={<IntegratedOccupationalHealth />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/certificates/templates" element={<CertificateTemplates />} />
                    <Route path="/admin/organizations" element={<Organizations />} />
                    <Route path="/admin/users" element={<Users />} />
                    <Route path="/admin/organizations/:organizationId/clients" element={<ClientOrganizations />} />
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

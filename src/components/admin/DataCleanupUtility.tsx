
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Trash2, Database, HardDrive, AlertTriangle, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Checkbox } from "@/components/ui/checkbox";

interface CleanupStats {
  documentsDeleted: number;
  certificatesDeleted: number;
  examinationsDeleted: number;
  patientsDeleted: number;
  storageFilesDeleted: number;
  auditLogsDeleted: number;
}

export const DataCleanupUtility = () => {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState("");
  const [stats, setStats] = useState<CleanupStats>({
    documentsDeleted: 0,
    certificatesDeleted: 0,
    examinationsDeleted: 0,
    patientsDeleted: 0,
    storageFilesDeleted: 0,
    auditLogsDeleted: 0
  });
  
  const [confirmationChecks, setConfirmationChecks] = useState({
    understanding: false,
    backup: false,
    irreversible: false
  });

  const isConfirmationComplete = Object.values(confirmationChecks).every(Boolean);

  const handleCleanupAll = async () => {
    if (!confirm("⚠️ FINAL CONFIRMATION: This will permanently delete ALL test data. Are you absolutely sure?")) {
      return;
    }

    setLoading(true);
    setProgress(0);
    
    try {
      // Step 1: Delete all storage files
      setCurrentStep("Deleting storage files...");
      const storageCount = await cleanupStorage();
      setStats(prev => ({ ...prev, storageFilesDeleted: storageCount }));
      setProgress(20);

      // Step 2: Delete audit logs
      setCurrentStep("Cleaning audit logs...");
      const auditCount = await cleanupAuditLogs();
      setStats(prev => ({ ...prev, auditLogsDeleted: auditCount }));
      setProgress(30);

      // Step 3: Delete certificates
      setCurrentStep("Deleting certificates...");
      const certCount = await cleanupCertificates();
      setStats(prev => ({ ...prev, certificatesDeleted: certCount }));
      setProgress(50);

      // Step 4: Delete medical examinations
      setCurrentStep("Deleting medical examinations...");
      const examCount = await cleanupMedicalExaminations();
      setStats(prev => ({ ...prev, examinationsDeleted: examCount }));
      setProgress(60);

      // Step 5: Delete documents
      setCurrentStep("Deleting documents...");
      const docCount = await cleanupDocuments();
      setStats(prev => ({ ...prev, documentsDeleted: docCount }));
      setProgress(80);

      // Step 6: Delete patients
      setCurrentStep("Deleting patients...");
      const patientCount = await cleanupPatients();
      setStats(prev => ({ ...prev, patientsDeleted: patientCount }));
      setProgress(90);

      // Step 7: Cleanup related data
      setCurrentStep("Cleaning up related data...");
      await cleanupRelatedData();
      setProgress(100);

      setCurrentStep("Cleanup completed successfully!");
      
      toast({
        title: "Production Cleanup Complete",
        description: `Successfully cleaned up all test data. Ready for production use!`,
        variant: "default"
      });

    } catch (error: any) {
      console.error("Error during cleanup:", error);
      toast({
        title: "Cleanup Failed",
        description: error.message || "An unexpected error occurred during cleanup",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const cleanupStorage = async (): Promise<number> => {
    try {
      const { data: files, error } = await supabase
        .storage
        .from('medical-documents')
        .list('', { limit: 1000 });
      
      if (error || !files || files.length === 0) {
        return 0;
      }

      const filePaths = files.map(file => file.name);
      
      const { error: deleteError } = await supabase
        .storage
        .from('medical-documents')
        .remove(filePaths);
      
      if (deleteError) {
        console.error("Error deleting storage files:", deleteError);
        return 0;
      }

      return filePaths.length;
    } catch (error) {
      console.error("Storage cleanup error:", error);
      return 0;
    }
  };

  const cleanupAuditLogs = async (): Promise<number> => {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
      
      if (error) {
        console.error("Error deleting audit logs:", error);
        return 0;
      }
      
      return Array.isArray(data) ? data.length : 0;
    } catch (error) {
      console.error("Audit logs cleanup error:", error);
      return 0;
    }
  };

  const cleanupCertificates = async (): Promise<number> => {
    try {
      const { data, error } = await supabase
        .from('certificates')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
      
      if (error) {
        console.error("Error deleting certificates:", error);
        return 0;
      }
      
      return Array.isArray(data) ? data.length : 0;
    } catch (error) {
      console.error("Certificates cleanup error:", error);
      return 0;
    }
  };

  const cleanupMedicalExaminations = async (): Promise<number> => {
    try {
      const { data, error } = await supabase
        .from('medical_examinations')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
      
      if (error) {
        console.error("Error deleting medical examinations:", error);
        return 0;
      }
      
      return Array.isArray(data) ? data.length : 0;
    } catch (error) {
      console.error("Medical examinations cleanup error:", error);
      return 0;
    }
  };

  const cleanupDocuments = async (): Promise<number> => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
      
      if (error) {
        console.error("Error deleting documents:", error);
        return 0;
      }
      
      return Array.isArray(data) ? data.length : 0;
    } catch (error) {
      console.error("Documents cleanup error:", error);
      return 0;
    }
  };

  const cleanupPatients = async (): Promise<number> => {
    try {
      const { data, error } = await supabase
        .from('patients')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
      
      if (error) {
        console.error("Error deleting patients:", error);
        return 0;
      }
      
      return Array.isArray(data) ? data.length : 0;
    } catch (error) {
      console.error("Patients cleanup error:", error);
      return 0;
    }
  };

  const cleanupRelatedData = async (): Promise<void> => {
    try {
      // Clean up certificate compliance
      await supabase
        .from('certificate_compliance')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      // Clean up certificate expirations
      await supabase
        .from('certificate_expirations')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      // Clean up medical test results
      await supabase
        .from('medical_test_results')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      // Clean up work queue
      await supabase
        .from('work_queue')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      // Clean up notifications
      await supabase
        .from('notifications')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

    } catch (error) {
      console.error("Related data cleanup error:", error);
    }
  };

  const handleCheckboxChange = (key: keyof typeof confirmationChecks) => {
    setConfirmationChecks(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <div className="space-y-6">
      <Card className="border-red-200 bg-red-50">
        <CardHeader className="pb-4">
          <CardTitle className="text-red-700 flex items-center gap-2">
            <AlertTriangle className="h-6 w-6" />
            Production Data Cleanup Utility
          </CardTitle>
          <CardDescription className="text-red-600">
            This will permanently delete ALL test data to prepare for production use
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>What will be deleted:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>All documents and files from storage</li>
                <li>All patient records</li>
                <li>All medical examinations</li>
                <li>All certificates</li>
                <li>All audit logs</li>
                <li>All related medical data</li>
              </ul>
            </AlertDescription>
          </Alert>

          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>What will be preserved:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Organizations and relationships</li>
                <li>User accounts and profiles</li>
                <li>Organization settings and branding</li>
                <li>User invitations</li>
                <li>Certificate templates</li>
              </ul>
            </AlertDescription>
          </Alert>

          <Separator />

          <div className="space-y-3">
            <h4 className="font-medium text-red-700">Required Confirmations:</h4>
            
            <div className="space-y-3">
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="understanding"
                  checked={confirmationChecks.understanding}
                  onCheckedChange={() => handleCheckboxChange('understanding')}
                />
                <label htmlFor="understanding" className="text-sm">
                  I understand this will delete ALL test data and patient records permanently
                </label>
              </div>

              <div className="flex items-start space-x-2">
                <Checkbox
                  id="backup"
                  checked={confirmationChecks.backup}
                  onCheckedChange={() => handleCheckboxChange('backup')}
                />
                <label htmlFor="backup" className="text-sm">
                  I have backed up any important data that needs to be preserved
                </label>
              </div>

              <div className="flex items-start space-x-2">
                <Checkbox
                  id="irreversible"
                  checked={confirmationChecks.irreversible}
                  onCheckedChange={() => handleCheckboxChange('irreversible')}
                />
                <label htmlFor="irreversible" className="text-sm">
                  I understand this action is irreversible and will prepare the system for production
                </label>
              </div>
            </div>
          </div>

          {loading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{currentStep}</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {(stats.documentsDeleted > 0 || stats.storageFilesDeleted > 0) && (
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="space-y-2">
                <Badge variant="outline" className="flex items-center gap-1">
                  <HardDrive className="h-3 w-3" />
                  Storage Files: {stats.storageFilesDeleted}
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Database className="h-3 w-3" />
                  Documents: {stats.documentsDeleted}
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Database className="h-3 w-3" />
                  Patients: {stats.patientsDeleted}
                </Badge>
              </div>
              <div className="space-y-2">
                <Badge variant="outline" className="flex items-center gap-1">
                  <Database className="h-3 w-3" />
                  Certificates: {stats.certificatesDeleted}
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Database className="h-3 w-3" />
                  Examinations: {stats.examinationsDeleted}
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Database className="h-3 w-3" />
                  Audit Logs: {stats.auditLogsDeleted}
                </Badge>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter>
          <Button 
            variant="destructive"
            onClick={handleCleanupAll}
            disabled={loading || !isConfirmationComplete}
            className="w-full"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Cleaning Production Data...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Start Production Cleanup
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

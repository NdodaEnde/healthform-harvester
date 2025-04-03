
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle, 
  AlertCircle,
  Calendar
} from "lucide-react";

interface CertificateComplianceCardProps {
  className?: string;
}

export default function CertificateComplianceCard({ className }: CertificateComplianceCardProps) {
  // Sample data for certificate compliance
  const complianceData = {
    overallCompliance: 92,
    completed: 226,
    pending: 12,
    overdue: 7,
    expiringCertificates: 18
  };

  // Sample data for department compliance
  const departmentComplianceData = [
    { name: 'Production', rate: 94 },
    { name: 'Maintenance', rate: 88 },
    { name: 'Warehouse', rate: 96 },
    { name: 'Administration', rate: 98 },
    { name: 'Logistics', rate: 86 }
  ];

  // Compliance insights
  const complianceInsights = [
    { type: 'success', message: 'Monthly compliance target of 90% met.' },
    { type: 'warning', message: 'Maintenance, Logistics departments require attention.' },
    { type: 'info', message: 'Schedule 18 follow-up assessments for expiring certificates.' }
  ];

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Certificate Compliance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h3 className="text-base font-medium mb-2">Overall Compliance</h3>
              <p className="text-5xl font-bold">{complianceData.overallCompliance}%</p>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <Card className="shadow-sm">
                <CardContent className="p-4 text-center">
                  <CheckCircle className="h-5 w-5 mx-auto text-emerald-500 mb-1" />
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold">{complianceData.completed}</p>
                </CardContent>
              </Card>
              
              <Card className="shadow-sm">
                <CardContent className="p-4 text-center">
                  <div className="h-5 w-5 mx-auto mb-1 text-amber-500">📋</div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold">{complianceData.pending}</p>
                </CardContent>
              </Card>
              
              <Card className="shadow-sm">
                <CardContent className="p-4 text-center">
                  <div className="h-5 w-5 mx-auto mb-1 text-red-500">❌</div>
                  <p className="text-sm text-muted-foreground">Overdue</p>
                  <p className="text-2xl font-bold">{complianceData.overdue}</p>
                </CardContent>
              </Card>
            </div>
            
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-5 w-5 text-amber-500" />
                <h3 className="text-base font-medium">Certificates Expiring Soon</h3>
                <span className="ml-auto text-lg font-bold">{complianceData.expiringCertificates}</span>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-800 text-sm">
                {complianceData.expiringCertificates} certificates will expire in the next 30 days. 
                Schedule follow-up assessments to maintain compliance.
              </div>
            </div>
          </div>
          
          <div className="lg:col-span-3">
            <h3 className="text-base font-medium mb-4">Compliance by Department</h3>
            <div className="space-y-4">
              {departmentComplianceData.map((dept, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{dept.name}</span>
                    <span className="text-sm font-medium">{dept.rate}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5">
                    <div 
                      className="bg-blue-900 h-2.5 rounded-full" 
                      style={{ width: `${dept.rate}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="lg:col-span-2">
            <h3 className="text-base font-medium mb-4">Compliance Insights</h3>
            <div className="space-y-4">
              {complianceInsights.map((insight, index) => {
                let icon = null;
                let textColor = '';
                if (insight.type === 'success') {
                  icon = <CheckCircle className="h-5 w-5 text-emerald-500" />;
                  textColor = 'text-emerald-700';
                } else if (insight.type === 'warning') {
                  icon = <AlertCircle className="h-5 w-5 text-amber-500" />;
                  textColor = 'text-amber-700';
                } else {
                  icon = <Calendar className="h-5 w-5 text-blue-500" />;
                  textColor = 'text-blue-700';
                }
                
                return (
                  <div key={index} className="flex items-start gap-3">
                    {icon}
                    <p className={`text-sm ${textColor}`}>{insight.message}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

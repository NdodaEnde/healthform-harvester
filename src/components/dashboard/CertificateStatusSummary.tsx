
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface CertificateStatusSummaryProps {
  className?: string;
}

const CertificateStatusSummary: React.FC<CertificateStatusSummaryProps> = ({ className }) => {
  // In a real application, this data would come from a backend API
  const fitStatuses = [
    { name: 'Fit', percentage: 65, color: 'bg-green-500' },
    { name: 'Fit with Restrictions', percentage: 20, color: 'bg-amber-500' },
    { name: 'Temporarily Unfit', percentage: 10, color: 'bg-orange-500' },
    { name: 'Unfit', percentage: 5, color: 'bg-red-500' }
  ];

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Fitness Status Distribution</CardTitle>
        <CardDescription>Patient certification status</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col space-y-6">
        {fitStatuses.map(status => (
          <div key={status.name} className="space-y-2">
            <div className="flex justify-between">
              <div className="flex items-center">
                <div className={`h-3 w-3 rounded-full ${status.color} mr-2`}></div>
                <span>{status.name}</span>
              </div>
              <span className="font-medium">{status.percentage}%</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className={`h-full ${status.color} rounded-full`} style={{width: `${status.percentage}%`}}></div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default CertificateStatusSummary;

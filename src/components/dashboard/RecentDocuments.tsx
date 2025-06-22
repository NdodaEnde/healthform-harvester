
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function RecentDocuments() {
  const documents = [
    {
      id: '1',
      document: 'Medical Certificate',
      patient: 'John Smith',
      status: 'Processed',
      date: '2 hours ago',
      statusColor: 'bg-green-100 text-green-800'
    },
    {
      id: '2',
      document: 'Fitness Certificate',
      patient: 'Sarah Johnson',
      status: 'Processing',
      date: '5 hours ago',
      statusColor: 'bg-orange-100 text-orange-800'
    },
    {
      id: '3',
      document: 'Health Assessment',
      patient: 'Mike Wilson',
      status: 'Processed',
      date: '1 day ago',
      statusColor: 'bg-green-100 text-green-800'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Recent Documents</CardTitle>
          <a href="#" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
            View All →
          </a>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Table Header */}
          <div className="grid grid-cols-4 gap-4 text-sm font-medium text-muted-foreground border-b pb-2">
            <div>Document</div>
            <div>Patient</div>
            <div>Status</div>
            <div>Date</div>
          </div>
          
          {/* Table Rows */}
          {documents.map((doc) => (
            <div key={doc.id} className="grid grid-cols-4 gap-4 text-sm py-2">
              <div className="font-medium">{doc.document}</div>
              <div className="text-muted-foreground">{doc.patient}</div>
              <div>
                <Badge variant="outline" className={doc.statusColor}>
                  {doc.status}
                </Badge>
              </div>
              <div className="text-muted-foreground">{doc.date}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

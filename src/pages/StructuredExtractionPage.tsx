
import React from 'react';
import { Helmet } from 'react-helmet';
import StructuredExtractionDashboard from '@/components/compound-documents/StructuredExtractionDashboard';

export default function StructuredExtractionPage() {
  return (
    <div className="space-y-6">
      <Helmet>
        <title>Structured Extraction | Document Processing</title>
      </Helmet>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Structured Extraction</h1>
          <p className="text-muted-foreground mt-2">
            Monitor and test LandingAI structured extraction implementation
          </p>
        </div>
      </div>

      <StructuredExtractionDashboard />
    </div>
  );
}

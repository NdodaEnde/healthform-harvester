
import React from 'react';
import { DataCleanupUtility } from '@/components/admin/DataCleanupUtility';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, Shield } from 'lucide-react';

const ProductionCleanupPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Production Data Cleanup</h1>
          <p className="text-muted-foreground mt-2">
            Prepare your system for production by cleaning up all test data
          </p>
        </div>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            This utility is designed to clean up test data while preserving your organization structure, 
            user accounts, and system configurations. Use this before going live with real client data.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Safety Information
            </CardTitle>
            <CardDescription>
              Important considerations before running the cleanup
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div>
                <strong>Best Practices:</strong>
                <ul className="list-disc list-inside mt-1 space-y-1 ml-4">
                  <li>Run this cleanup during maintenance hours</li>
                  <li>Inform all users that test data will be removed</li>
                  <li>Verify that organizations and user accounts are correctly configured</li>
                  <li>Test the upload and validation workflow after cleanup</li>
                </ul>
              </div>
              
              <div>
                <strong>After Cleanup:</strong>
                <ul className="list-disc list-inside mt-1 space-y-1 ml-4">
                  <li>Your system will be ready for real production data</li>
                  <li>All organization relationships will remain intact</li>
                  <li>Users can immediately start uploading real documents</li>
                  <li>Certificate templates and settings will be preserved</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <DataCleanupUtility />
      </div>
    </div>
  );
};

export default ProductionCleanupPage;

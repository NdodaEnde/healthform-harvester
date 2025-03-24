
import React from 'react';
import { Helmet } from 'react-helmet';
import FormTemplateList from '@/components/FormBuilder/FormTemplateList';

const TemplatesListPage: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Form Templates | Health Portal</title>
      </Helmet>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Form Templates</h1>
            <p className="text-muted-foreground">
              Create and manage custom form templates for your organization.
            </p>
          </div>
        </div>

        <FormTemplateList />
      </div>
    </>
  );
};

export default TemplatesListPage;

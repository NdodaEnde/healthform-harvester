
import { FixedTemplate } from '@/types/template';

export const fixedTemplates: FixedTemplate[] = [
  {
    id: 'historical-certificate',
    name: 'Historical Medical Certificate',
    description: 'Traditional medical certificate with signature and stamp images. Perfect for historical document digitization.',
    category: 'fixed',
    component: 'HistoricalCertificateTemplate',
    preview: 'Classic layout with signature and stamp positioning'
  },
  {
    id: 'modern-certificate',
    name: 'Modern Medical Certificate',
    description: 'Clean, contemporary medical certificate design with modern styling.',
    category: 'fixed',
    component: 'ModernCertificateTemplate',
    preview: 'Modern layout with clean typography and structured sections'
  }
];

export const getFixedTemplate = (id: string): FixedTemplate | undefined => {
  return fixedTemplates.find(template => template.id === id);
};

export const getTemplateComponent = (templateId: string) => {
  switch (templateId) {
    case 'historical-certificate':
      return 'historical';
    case 'modern-certificate':
      return 'modern';
    default:
      return 'historical'; // Default fallback
  }
};

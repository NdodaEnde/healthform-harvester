import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';
import { CompoundDocument, CompoundDocumentSection, SectionType } from '@/types/compound-document';
import { useCompoundDocumentSections } from '@/hooks/useCompoundDocuments';

interface SectionEditorProps {
  document: CompoundDocument;
  onSectionUpdate?: () => void;
}

const SECTION_TYPE_OPTIONS: { value: SectionType; label: string }[] = [
  { value: 'medical_questionnaire', label: 'Medical Questionnaire' },
  { value: 'vision_test', label: 'Vision Test' },
  { value: 'hearing_test', label: 'Hearing Test' },
  { value: 'lung_function', label: 'Lung Function' },
  { value: 'physical_examination', label: 'Physical Examination' },
  { value: 'drug_screen', label: 'Drug Screen' },
  { value: 'x_ray_report', label: 'X-Ray Report' },
  { value: 'fitness_declaration', label: 'Fitness Declaration' },
  { value: 'work_restrictions', label: 'Work Restrictions' },
  { value: 'follow_up_recommendations', label: 'Follow-up Recommendations' }
];

const SectionEditor: React.FC<SectionEditorProps> = ({ document, onSectionUpdate }) => {
  const { sections, loading, refreshSections } = useCompoundDocumentSections(document.id);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [newSection, setNewSection] = useState({
    section_type: 'medical_questionnaire' as SectionType,
    section_name: '',
    page_range: ''
  });

  useEffect(() => {
    if (document.detected_sections.length > 0 && sections.length === 0) {
      // Auto-create sections from detected sections
      document.detected_sections.forEach(detectedSection => {
        // This would typically call an API to create the section
        console.log('Auto-creating section:', detectedSection);
      });
    }
  }, [document.detected_sections, sections]);

  const getValidationStatusColor = (status: CompoundDocumentSection['validation_status']) => {
    switch (status) {
      case 'validated':
        return 'bg-green-100 text-green-800';
      case 'requires_review':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getValidationStatusIcon = (status: CompoundDocumentSection['validation_status']) => {
    switch (status) {
      case 'validated':
        return <CheckCircle className="h-4 w-4" />;
      case 'requires_review':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const handleAddSection = () => {
    // This would typically call an API to create the section
    console.log('Adding new section:', newSection);
    setNewSection({
      section_type: 'medical_questionnaire',
      section_name: '',
      page_range: ''
    });
    refreshSections();
    onSectionUpdate?.();
  };

  const handleValidateSection = (sectionId: string) => {
    // This would typically call an API to validate the section
    console.log('Validating section:', sectionId);
    refreshSections();
    onSectionUpdate?.();
  };

  const handleDeleteSection = (sectionId: string) => {
    // This would typically call an API to delete the section
    console.log('Deleting section:', sectionId);
    refreshSections();
    onSectionUpdate?.();
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Section Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Section Management
          <Badge variant="outline">
            {sections.length} sections
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Auto-detected Sections */}
        {document.detected_sections.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-medium text-sm text-gray-700">Auto-detected Sections</h3>
            <div className="grid gap-2">
              {document.detected_sections.map((detectedSection, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg"
                >
                  <div>
                    <p className="font-medium">{detectedSection.section_name}</p>
                    <p className="text-sm text-gray-600">
                      Pages {detectedSection.page_range} • 
                      Confidence: {Math.round(detectedSection.confidence * 100)}%
                    </p>
                  </div>
                  <Badge variant="outline" className="bg-blue-100 text-blue-800">
                    Detected
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Existing Sections */}
        {sections.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-medium text-sm text-gray-700">Document Sections</h3>
            <div className="space-y-2">
              {sections.map((section) => (
                <div
                  key={section.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getValidationStatusIcon(section.validation_status)}
                      <h4 className="font-medium">{section.section_name}</h4>
                      <Badge className={getValidationStatusColor(section.validation_status)}>
                        {section.validation_status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>Type: {section.section_type.replace('_', ' ')}</span>
                      {section.page_range && (
                        <span>Pages: {section.page_range}</span>
                      )}
                      {section.processing_confidence && (
                        <span>
                          Confidence: {Math.round(section.processing_confidence * 100)}%
                        </span>
                      )}
                    </div>

                    {section.review_notes && (
                      <p className="text-sm text-yellow-700 mt-2 bg-yellow-50 p-2 rounded">
                        Review Notes: {section.review_notes}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    
                    {section.validation_status !== 'validated' && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleValidateSection(section.id)}
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    )}
                    
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setEditingSection(section.id)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDeleteSection(section.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add New Section */}
        <div className="space-y-4 pt-4 border-t">
          <h3 className="font-medium text-sm text-gray-700">Add New Section</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="section_type">Section Type</Label>
              <select
                id="section_type"
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                value={newSection.section_type}
                onChange={(e) => setNewSection(prev => ({
                  ...prev,
                  section_type: e.target.value as SectionType
                }))}
              >
                {SECTION_TYPE_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="section_name">Section Name</Label>
              <Input
                id="section_name"
                placeholder="Enter section name"
                value={newSection.section_name}
                onChange={(e) => setNewSection(prev => ({
                  ...prev,
                  section_name: e.target.value
                }))}
              />
            </div>

            <div>
              <Label htmlFor="page_range">Page Range</Label>
              <Input
                id="page_range"
                placeholder="e.g., 1-3 or 5"
                value={newSection.page_range}
                onChange={(e) => setNewSection(prev => ({
                  ...prev,
                  page_range: e.target.value
                }))}
              />
            </div>
          </div>

          <Button 
            onClick={handleAddSection}
            disabled={!newSection.section_name || !newSection.page_range}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Section
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SectionEditor;

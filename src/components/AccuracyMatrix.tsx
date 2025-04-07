import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from "recharts";
import { useOrganization } from "@/contexts/OrganizationContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Json } from "@/integrations/supabase/types";
import { format, subMonths, parse } from "date-fns";

interface AccuracyData {
  documentType: string;
  totalDocuments: number;
  editedDocuments: number;
  totalFields: number;
  editedFields: number;
  accuracyRate: number;
}

interface FrequentlyEditedField {
  fieldName: string;
  editCount: number;
  percentage: number;
}

interface MonthlyAccuracy {
  month: string;
  accuracy: number;
  documentCount: number;
}

interface AccuracyResult {
  documentTypes: AccuracyData[];
  frequentlyEditedFields: FrequentlyEditedField[];
  monthlyTrends: MonthlyAccuracy[];
}

interface ExtractedData {
  edit_tracking?: Record<string, any>;
  [key: string]: any;
}

const COLORS = ['#4ade80', '#f87171', '#60a5fa', '#fbbf24'];
// Metadata fields that should be excluded from accuracy tracking
const METADATA_FIELDS = ['last_edited_at', 'edit_tracking', 'created_at', 'updated_at'];

export const AccuracyMatrix = () => {
  const { getEffectiveOrganizationId } = useOrganization();
  const organizationId = getEffectiveOrganizationId();

  const { data: accuracyData, isLoading } = useQuery<AccuracyResult>({
    queryKey: ['document-accuracy', organizationId],
    queryFn: async () => {
      if (!organizationId) return {
        documentTypes: [],
        frequentlyEditedFields: [],
        monthlyTrends: []
      };

      const { data: documents, error } = await supabase
        .from('documents')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching accuracy data:', error);
        return {
          documentTypes: [],
          frequentlyEditedFields: [],
          monthlyTrends: []
        };
      }

      const documentTypes: Record<string, AccuracyData> = {};
      const fieldEditCounts: Record<string, number> = {};
      const monthlyAccuracyData: Record<string, { total: number, edited: number, documents: number }> = {};
      
      const today = new Date();
      for (let i = 0; i < 6; i++) {
        const monthDate = subMonths(today, i);
        const monthKey = format(monthDate, 'MMM yyyy');
        monthlyAccuracyData[monthKey] = { total: 0, edited: 0, documents: 0 };
      }
      
      documents?.forEach(doc => {
        const docType = doc.document_type || 'unknown';
        const docDate = new Date(doc.created_at);
        const monthKey = format(docDate, 'MMM yyyy');
        
        if (monthlyAccuracyData[monthKey]) {
          monthlyAccuracyData[monthKey].documents += 1;
        }
        
        if (!documentTypes[docType]) {
          documentTypes[docType] = {
            documentType: formatDocumentType(docType),
            totalDocuments: 0,
            editedDocuments: 0,
            totalFields: 0,
            editedFields: 0,
            accuracyRate: 100
          };
        }

        documentTypes[docType].totalDocuments++;
        
        const extractedData = doc.extracted_data as ExtractedData;
        
        if (extractedData && typeof extractedData === 'object' && extractedData.edit_tracking) {
          const editTracking = extractedData.edit_tracking;
          
          const totalFieldCount = countTotalFields(extractedData);
          const editedFieldCount = Object.keys(editTracking).length;
          
          documentTypes[docType].totalFields += totalFieldCount;
          documentTypes[docType].editedFields += editedFieldCount;
          
          if (editedFieldCount > 0) {
            documentTypes[docType].editedDocuments++;
          }
          
          Object.keys(editTracking).forEach(fieldPath => {
            const normalizedField = fieldPath.split('.').pop() || fieldPath;
            // Skip metadata fields
            if (!METADATA_FIELDS.includes(normalizedField)) {
              fieldEditCounts[normalizedField] = (fieldEditCounts[normalizedField] || 0) + 1;
            }
          });
          
          if (monthlyAccuracyData[monthKey]) {
            monthlyAccuracyData[monthKey].total += totalFieldCount;
            monthlyAccuracyData[monthKey].edited += editedFieldCount;
          }
        } else {
          const totalFieldCount = countTotalFields(extractedData);
          documentTypes[docType].totalFields += totalFieldCount;
          
          if (monthlyAccuracyData[monthKey]) {
            monthlyAccuracyData[monthKey].total += totalFieldCount;
          }
        }
      });
      
      Object.keys(documentTypes).forEach(docType => {
        const data = documentTypes[docType];
        
        if (data.totalFields > 0) {
          data.accuracyRate = parseFloat(
            (((data.totalFields - data.editedFields) / data.totalFields) * 100).toFixed(2)
          );
        }
      });
      
      const frequentlyEditedFields = Object.entries(fieldEditCounts)
        .map(([fieldName, editCount]) => ({
          fieldName: formatFieldName(fieldName),
          editCount,
          percentage: parseFloat(((editCount / Object.values(fieldEditCounts).reduce((a, b) => a + b, 0)) * 100).toFixed(1))
        }))
        .sort((a, b) => b.editCount - a.editCount)
        .slice(0, 5);
      
      const monthlyTrends = Object.entries(monthlyAccuracyData)
        .map(([month, data]) => ({
          month,
          accuracy: data.total > 0 
            ? parseFloat((((data.total - data.edited) / data.total) * 100).toFixed(1)) 
            : 100,
          documentCount: data.documents
        }))
        .sort((a, b) => {
          const dateA = parse(a.month, 'MMM yyyy', new Date());
          const dateB = parse(b.month, 'MMM yyyy', new Date());
          return dateA.getTime() - dateB.getTime();
        });
      
      return {
        documentTypes: Object.values(documentTypes),
        frequentlyEditedFields,
        monthlyTrends,
      };
    },
    enabled: !!organizationId
  });

  const formatFieldName = (fieldName: string): string => {
    if (fieldName.includes(' ')) return fieldName;
    
    return fieldName
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const countTotalFields = (extractedData: any): number => {
    if (!extractedData) return 0;
    
    let count = 0;
    const countObjectFields = (obj: any) => {
      if (!obj || typeof obj !== 'object') return;
      
      if (Array.isArray(obj)) {
        obj.forEach(item => countObjectFields(item));
        return;
      }
      
      Object.keys(obj).forEach(key => {
        // Skip metadata fields when counting
        if (!METADATA_FIELDS.includes(key)) {
          if (typeof obj[key] === 'object' && obj[key] !== null) {
            countObjectFields(obj[key]);
          } else {
            count++;
          }
        }
      });
    };
    
    countObjectFields(extractedData);
    return count;
  };

  const formatDocumentType = (type: string): string => {
    if (!type) return 'Unknown';
    
    return type
      .replace(/-/g, ' ')
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const calculateOverallAccuracy = (): number => {
    if (!accuracyData || !accuracyData.documentTypes || accuracyData.documentTypes.length === 0) return 100;
    
    const totalFields = accuracyData.documentTypes.reduce((sum, item) => sum + item.totalFields, 0);
    const totalEdited = accuracyData.documentTypes.reduce((sum, item) => sum + item.editedFields, 0);
    
    if (totalFields === 0) return 100;
    return parseFloat((((totalFields - totalEdited) / totalFields) * 100).toFixed(2));
  };

  const prepareOverallData = () => {
    if (!accuracyData || !accuracyData.documentTypes || accuracyData.documentTypes.length === 0) {
      return [
        { name: 'Accurate', value: 100 },
        { name: 'Edited', value: 0 }
      ];
    }
    
    const overallAccuracy = calculateOverallAccuracy();
    
    return [
      { name: 'Accurate', value: overallAccuracy },
      { name: 'Edited', value: 100 - overallAccuracy }
    ];
  };

  if (isLoading) {
    return (
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle>Processing Accuracy</CardTitle>
          <CardDescription>Document extraction accuracy metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[250px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!accuracyData || !accuracyData.documentTypes || accuracyData.documentTypes.length === 0) {
    return (
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle>Processing Accuracy</CardTitle>
          <CardDescription>Document extraction accuracy metrics</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-[250px]">
          <p className="text-muted-foreground text-center">
            No accuracy data available yet. Edit document data to start tracking accuracy.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle>Processing Accuracy</CardTitle>
        <CardDescription>Document extraction accuracy metrics</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="h-[250px]">
            <h3 className="text-sm font-medium mb-2 text-center">Overall Accuracy</h3>
            <ResponsiveContainer width="100%" height="90%">
              <PieChart>
                <Pie
                  data={prepareOverallData()}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {prepareOverallData().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#ef4444'} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="h-[250px]">
            <h3 className="text-sm font-medium mb-2 text-center">Accuracy by Document Type</h3>
            <ResponsiveContainer width="100%" height="90%">
              <BarChart
                data={accuracyData?.documentTypes}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="documentType" />
                <YAxis domain={[0, 100]} />
                <Tooltip formatter={(value) => [`${value}%`, 'Accuracy']} />
                <Bar dataKey="accuracyRate" fill="#8884d8" name="Accuracy">
                  {accuracyData?.documentTypes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="mt-6">
          <h3 className="text-sm font-medium mb-2">Most Frequently Edited Fields</h3>
          {accuracyData?.frequentlyEditedFields && accuracyData.frequentlyEditedFields.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Field Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Edit Count
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      % of All Field Edits
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Visualization
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {accuracyData.frequentlyEditedFields.map((field, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {field.fieldName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {field.editCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {field.percentage}% of all edits
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="h-2.5 rounded-full bg-blue-500"
                            style={{ width: `${field.percentage}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-2">
              No field edit data available yet.
            </p>
          )}
        </div>
        
        <div className="mt-6">
          <h3 className="text-sm font-medium mb-2">Accuracy Trends Over Time</h3>
          {accuracyData?.monthlyTrends && accuracyData.monthlyTrends.length > 0 ? (
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={accuracyData.monthlyTrends}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip formatter={(value, name) => {
                    if (name === 'accuracy') return [`${value}%`, 'Accuracy'];
                    if (name === 'documentCount') return [value, 'Documents'];
                    return [value, name];
                  }} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="accuracy" 
                    stroke="#10b981" 
                    activeDot={{ r: 8 }} 
                    name="Accuracy (%)"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="documentCount" 
                    stroke="#6366f1" 
                    name="Document Count" 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-2">
              No trend data available yet. More document history is needed.
            </p>
          )}
        </div>

        <div className="mt-4">
          <h3 className="text-sm font-medium mb-2">Document Type Statistics</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Document Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Accuracy
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Documents
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Edited
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {accuracyData?.documentTypes.map((item, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.documentType}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <div className="w-24 bg-gray-200 rounded-full h-2.5">
                          <div 
                            className={`h-2.5 rounded-full ${
                              item.accuracyRate >= 90 ? 'bg-green-500' : 
                              item.accuracyRate >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${item.accuracyRate}%` }}
                          />
                        </div>
                        <span className="ml-2">{item.accuracyRate}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.totalDocuments}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.editedDocuments} ({(item.editedDocuments / item.totalDocuments * 100).toFixed(1)}%)
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

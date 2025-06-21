
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, Table, Loader2 } from 'lucide-react';
import { AnalyticsExportService, ExportData, ExportOptions } from '@/services/AnalyticsExportService';
import { usePackage } from '@/contexts/PackageContext';
import { toast } from 'sonner';

interface AnalyticsExportButtonProps {
  data: ExportData;
  title?: string;
  organizationName?: string;
  className?: string;
  variant?: 'default' | 'outline' | 'secondary';
  size?: 'default' | 'sm' | 'lg';
}

const AnalyticsExportButton: React.FC<AnalyticsExportButtonProps> = ({
  data,
  title = 'Analytics Report',
  organizationName,
  className,
  variant = 'outline',
  size = 'default'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'csv'>('pdf');
  const { currentTier, isPremium } = usePackage();

  const handleExport = async () => {
    if (!isPremium) {
      toast.error('Export functionality requires Premium subscription');
      return;
    }

    setIsExporting(true);
    try {
      const options: ExportOptions = {
        format: selectedFormat,
        title,
        organizationName,
        includeCharts: selectedFormat === 'pdf',
      };

      await AnalyticsExportService.exportData(data, options);
      toast.success(`${selectedFormat.toUpperCase()} export completed successfully!`);
      setIsOpen(false);
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const exportFormats = [
    {
      value: 'pdf' as const,
      label: 'PDF Report',
      description: 'Comprehensive report with charts and formatting',
      icon: FileText,
      available: isPremium
    },
    {
      value: 'csv' as const,
      label: 'CSV Data',
      description: 'Raw data for analysis in spreadsheets',
      icon: Table,
      available: isPremium
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <Download className="h-4 w-4 mr-2" />
          Export Report
          {!isPremium && (
            <Badge variant="outline" className="ml-2 text-xs">
              Premium
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Analytics Report
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Export Format
            </label>
            <Select value={selectedFormat} onValueChange={(value: 'pdf' | 'csv') => setSelectedFormat(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select export format" />
              </SelectTrigger>
              <SelectContent>
                {exportFormats.map((format) => {
                  const IconComponent = format.icon;
                  return (
                    <SelectItem 
                      key={format.value} 
                      value={format.value}
                      disabled={!format.available}
                    >
                      <div className="flex items-center gap-2">
                        <IconComponent className="h-4 w-4" />
                        <div>
                          <div className="font-medium">{format.label}</div>
                          <div className="text-xs text-muted-foreground">
                            {format.description}
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {!isPremium && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="text-yellow-700">
                    Premium Required
                  </Badge>
                </div>
                <p className="text-sm text-yellow-800">
                  Export functionality is available with Premium subscription. 
                  Upgrade to access comprehensive report generation.
                </p>
              </CardContent>
            </Card>
          )}

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleExport} 
              disabled={isExporting || !isPremium}
            >
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export {selectedFormat.toUpperCase()}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AnalyticsExportButton;

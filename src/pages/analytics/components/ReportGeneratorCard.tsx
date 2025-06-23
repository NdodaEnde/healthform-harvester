
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  FileText,
  Download,
  Mail,
  ClipboardList,
  Calendar,
} from "lucide-react";
import { format } from "date-fns";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useBasicAnalytics } from '@/hooks/useBasicAnalytics';
import { toast } from 'sonner';

// Define DateRange type
interface DateRange {
  from: Date;
  to?: Date;
}

export default function ReportGeneratorCard() {
  const [reportType, setReportType] = useState("patient-overview");
  const [outputFormat, setOutputFormat] = useState("pdf");
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(2023, 4, 1),
    to: new Date(),
  });
  const [includeOptions, setIncludeOptions] = useState({
    charts: true,
    tables: true,
    summary: true,
    patientDetails: false,
  });

  const { data: analytics, isLoading } = useBasicAnalytics();

  const handleCheckboxChange = (key: keyof typeof includeOptions) => {
    setIncludeOptions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const reportTypes = [
    {
      value: "patient-overview",
      label: "Patient Overview",
      description: `${analytics.totalPatients} patients across ${analytics.totalCompanies} companies`,
    },
    {
      value: "compliance-status",
      label: "Compliance Status",
      description: `${analytics.complianceRate}% compliance rate with ${analytics.certificatesExpiring} expiring soon`,
    },
    {
      value: "fitness-declarations",
      label: "Fitness Declarations",
      description: `${analytics.totalFit} fit workers out of ${analytics.totalPatients} total`,
    },
    {
      value: "examination-summary",
      label: "Medical Examinations",
      description: `${analytics.totalExaminations} examinations with ${analytics.completionRate}% completion rate`,
    },
    {
      value: "pending-documents",
      label: "Document Processing",
      description: `${analytics.pendingDocuments} pending documents requiring attention`,
    },
  ];

  const generateReport = async () => {
    if (!analytics || isLoading) {
      toast.error('Analytics data not available. Please try again.');
      return;
    }

    const selectedReportType = reportTypes.find(r => r.value === reportType);
    if (!selectedReportType) return;

    // Generate report content based on real data
    const reportContent = generateReportContent(selectedReportType, analytics, date, includeOptions);
    
    // Create and download the report
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedReportType.label.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.${outputFormat === 'pdf' ? 'txt' : outputFormat}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success(`${selectedReportType.label} generated successfully!`);
  };

  const generateReportContent = (reportType: any, data: any, dateRange: DateRange | undefined, options: any) => {
    const header = `
${reportType.label}
Generated: ${format(new Date(), 'PPpp')}
Date Range: ${dateRange?.from ? format(dateRange.from, 'PPP') : 'All time'} - ${dateRange?.to ? format(dateRange.to, 'PPP') : 'Present'}
========================================

`;

    let content = '';

    switch (reportType.value) {
      case 'patient-overview':
        content = `
PATIENT OVERVIEW SUMMARY
Total Patients: ${data.totalPatients}
Active Companies: ${data.totalCompanies}
Compliance Rate: ${data.complianceRate}%
Recent Activity: ${data.recentActivityCount} actions in last 7 days

${options.summary ? `
EXECUTIVE SUMMARY
This report provides an overview of all patients in the system. With ${data.totalPatients} total patients across ${data.totalCompanies} companies, the organization maintains a ${data.complianceRate}% compliance rate. Recent activity shows ${data.recentActivityCount} actions in the past week, indicating an active health management program.
` : ''}
`;
        break;

      case 'compliance-status':
        content = `
COMPLIANCE STATUS REPORT
Current Compliance Rate: ${data.complianceRate}%
Compliant Workers: ${data.totalFit}
Total Workers: ${data.totalPatients}
Certificates Expiring Soon: ${data.certificatesExpiring}
Pending Documents: ${data.pendingDocuments}

${options.summary ? `
COMPLIANCE ANALYSIS
The organization maintains a ${data.complianceRate}% compliance rate with ${data.totalFit} workers currently fit for duty. ${data.certificatesExpiring} certificates are expiring soon and require attention. There are ${data.pendingDocuments} pending documents that need processing to maintain compliance standards.
` : ''}
`;
        break;

      case 'fitness-declarations':
        content = `
FITNESS DECLARATIONS REPORT
Total Fit Workers: ${data.totalFit}
Total Workers: ${data.totalPatients}
Fitness Rate: ${((data.totalFit / data.totalPatients) * 100).toFixed(1)}%
Total Examinations: ${data.totalExaminations}
Completion Rate: ${data.completionRate}%

${options.summary ? `
FITNESS OVERVIEW
Out of ${data.totalPatients} total workers, ${data.totalFit} are currently declared fit for duty, representing a ${((data.totalFit / data.totalPatients) * 100).toFixed(1)}% fitness rate. ${data.totalExaminations} medical examinations have been completed with a ${data.completionRate}% completion rate.
` : ''}
`;
        break;

      case 'examination-summary':
        content = `
MEDICAL EXAMINATIONS REPORT
Total Examinations: ${data.totalExaminations}
Completion Rate: ${data.completionRate}%
Total Patients: ${data.totalPatients}
Companies Served: ${data.totalCompanies}
Recent Activity: ${data.recentActivityCount} in last 7 days

${options.summary ? `
EXAMINATION OVERVIEW
${data.totalExaminations} medical examinations have been conducted across ${data.totalCompanies} companies with a ${data.completionRate}% completion rate. Recent activity shows ${data.recentActivityCount} examination-related actions in the past week, indicating consistent health monitoring practices.
` : ''}
`;
        break;

      case 'pending-documents':
        content = `
DOCUMENT PROCESSING REPORT
Pending Documents: ${data.pendingDocuments}
Total Patients: ${data.totalPatients}
Processing Rate: ${(((data.totalPatients - data.pendingDocuments) / data.totalPatients) * 100).toFixed(1)}%
Recent Activity: ${data.recentActivityCount} actions in last 7 days

${options.summary ? `
DOCUMENT PROCESSING STATUS
There are currently ${data.pendingDocuments} documents pending processing out of ${data.totalPatients} total patient records. This represents a ${(((data.totalPatients - data.pendingDocuments) / data.totalPatients) * 100).toFixed(1)}% processing rate. Recent activity shows ${data.recentActivityCount} document-related actions in the past week.
` : ''}
`;
        break;

      default:
        content = 'Report content not available.';
    }

    return header + content + `

========================================
Report generated by Health Management System
Data sourced from live database
Options: ${Object.entries(options).filter(([_, v]) => v).map(([k, _]) => k).join(', ')}
`;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5" />
          Analytics Report Generator
        </CardTitle>
        <CardDescription>
          Generate detailed reports based on real-time data from your organization
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="report-type">Report Type</Label>
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger id="report-type">
              <SelectValue placeholder="Select report type" />
            </SelectTrigger>
            <SelectContent>
              {reportTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  <div className="flex flex-col">
                    <span>{type.label}</span>
                    <span className="text-xs text-muted-foreground">
                      {type.description}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Date Range</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !date && "text-muted-foreground",
                )}
              >
                <Calendar className="mr-2 h-4 w-4" />
                {date?.from ? (
                  date.to ? (
                    <>
                      {format(date.from, "LLL dd, y")} -{" "}
                      {format(date.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(date.from, "LLL dd, y")
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                initialFocus
                mode="range"
                defaultMonth={date?.from}
                selected={date}
                onSelect={setDate}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label htmlFor="format">Output Format</Label>
          <Select value={outputFormat} onValueChange={setOutputFormat}>
            <SelectTrigger id="format">
              <SelectValue placeholder="Select format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="txt">
                <div className="flex items-center">
                  <FileText className="mr-2 h-4 w-4" />
                  Text Document
                </div>
              </SelectItem>
              <SelectItem value="csv">
                <div className="flex items-center">
                  <FileText className="mr-2 h-4 w-4" />
                  CSV Spreadsheet
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator />

        <div className="space-y-3">
          <Label>Include in Report</Label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="charts"
                checked={includeOptions.charts}
                onCheckedChange={() => handleCheckboxChange("charts")}
              />
              <Label htmlFor="charts" className="text-sm">
                Charts & Visualizations
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="tables"
                checked={includeOptions.tables}
                onCheckedChange={() => handleCheckboxChange("tables")}
              />
              <Label htmlFor="tables" className="text-sm">
                Data Tables
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="summary"
                checked={includeOptions.summary}
                onCheckedChange={() => handleCheckboxChange("summary")}
              />
              <Label htmlFor="summary" className="text-sm">
                Executive Summary
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="patient-details"
                checked={includeOptions.patientDetails}
                onCheckedChange={() => handleCheckboxChange("patientDetails")}
              />
              <Label htmlFor="patient-details" className="text-sm">
                Patient Details
              </Label>
            </div>
          </div>
        </div>

        {isLoading && (
          <div className="text-sm text-muted-foreground">
            Loading analytics data...
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={() => {
          setReportType("patient-overview");
          setDate({ from: new Date(2023, 4, 1), to: new Date() });
          setIncludeOptions({ charts: true, tables: true, summary: true, patientDetails: false });
        }}>
          Reset
        </Button>
        <div className="flex space-x-2">
          <Button variant="outline" disabled>
            <Mail className="mr-2 h-4 w-4" />
            Email Report
          </Button>
          <Button onClick={generateReport} disabled={isLoading}>
            <Download className="mr-2 h-4 w-4" />
            Generate Report
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

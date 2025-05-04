
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

// Define DateRange type
interface DateRange {
  from: Date;
  to?: Date;
}

export default function ReportGeneratorCard() {
  const [reportType, setReportType] = useState("document-processing");
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

  const handleCheckboxChange = (key: keyof typeof includeOptions) => {
    setIncludeOptions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const reportTypes = [
    {
      value: "document-processing",
      label: "Document Processing",
      description: "Statistics on document uploads and processing",
    },
    {
      value: "patient-records",
      label: "Patient Records",
      description: "Summary of patient record activities",
    },
    {
      value: "occupational-health",
      label: "Occupational Health",
      description: "Occupational health and medical examination data",
    },
    {
      value: "system-performance",
      label: "System Performance",
      description: "System performance and uptime metrics",
    },
    {
      value: "user-activity",
      label: "User Activity",
      description: "User login and activity statistics",
    },
  ];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5" />
          Report Generator
        </CardTitle>
        <CardDescription>
          Generate customized reports for your healthcare data
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
              <SelectItem value="pdf">
                <div className="flex items-center">
                  <FileText className="mr-2 h-4 w-4" />
                  PDF Document
                </div>
              </SelectItem>
              <SelectItem value="csv">
                <div className="flex items-center">
                  <FileText className="mr-2 h-4 w-4" />
                  CSV Spreadsheet
                </div>
              </SelectItem>
              <SelectItem value="xlsx">
                <div className="flex items-center">
                  <FileText className="mr-2 h-4 w-4" />
                  Excel Spreadsheet
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
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline">Reset</Button>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Mail className="mr-2 h-4 w-4" />
            Email Report
          </Button>
          <Button>
            <Download className="mr-2 h-4 w-4" />
            Generate Report
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

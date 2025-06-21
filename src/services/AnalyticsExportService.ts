
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';

export interface ExportData {
  executiveSummary?: any;
  monthlyTrends?: any[];
  riskAssessment?: any[];
  companyBenchmarks?: any[];
  patientTestHistory?: any[];
}

export interface ExportOptions {
  format: 'pdf' | 'csv';
  title: string;
  includeCharts?: boolean;
  organizationName?: string;
  dateRange?: string;
}

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export class AnalyticsExportService {
  static async exportToPDF(data: ExportData, options: ExportOptions): Promise<void> {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;
    let yPosition = margin;

    // Header
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text(options.title, margin, yPosition);
    yPosition += 15;

    if (options.organizationName) {
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text(`Organization: ${options.organizationName}`, margin, yPosition);
      yPosition += 10;
    }

    doc.setFontSize(10);
    doc.text(`Generated: ${format(new Date(), 'PPP')}`, margin, yPosition);
    yPosition += 20;

    // Executive Summary
    if (data.executiveSummary) {
      doc.setFontSize(16);
      doc.setTextColor(40, 40, 40);
      doc.text('Executive Summary', margin, yPosition);
      yPosition += 15;

      const summaryData = [
        ['Total Patients', data.executiveSummary.total_patients?.toLocaleString() || '0'],
        ['Total Companies', data.executiveSummary.total_companies?.toLocaleString() || '0'],
        ['Total Examinations', data.executiveSummary.total_examinations?.toLocaleString() || '0'],
        ['Completion Rate', `${(data.executiveSummary.overall_completion_rate || 0).toFixed(1)}%`],
        ['Health Score', (data.executiveSummary.health_score || 0).toString()],
        ['Total Fit Workers', data.executiveSummary.total_fit?.toLocaleString() || '0'],
      ];

      doc.autoTable({
        startY: yPosition,
        head: [['Metric', 'Value']],
        body: summaryData,
        margin: { left: margin, right: margin },
        styles: { fontSize: 10 },
        headStyles: { fillColor: [59, 130, 246] },
      });

      yPosition = (doc as any).lastAutoTable.finalY + 20;
    }

    // Risk Assessment
    if (data.riskAssessment && data.riskAssessment.length > 0) {
      if (yPosition > 200) {
        doc.addPage();
        yPosition = margin;
      }

      doc.setFontSize(16);
      doc.text('Risk Assessment Summary', margin, yPosition);
      yPosition += 15;

      const riskData = data.riskAssessment.slice(0, 10).map(item => [
        item.company_name || 'N/A',
        item.test_type || 'N/A',
        item.risk_level || 'N/A',
        item.test_count?.toString() || '0',
      ]);

      doc.autoTable({
        startY: yPosition,
        head: [['Company', 'Test Type', 'Risk Level', 'Test Count']],
        body: riskData,
        margin: { left: margin, right: margin },
        styles: { fontSize: 9 },
        headStyles: { fillColor: [239, 68, 68] },
      });

      yPosition = (doc as any).lastAutoTable.finalY + 20;
    }

    // Monthly Trends
    if (data.monthlyTrends && data.monthlyTrends.length > 0) {
      if (yPosition > 200) {
        doc.addPage();
        yPosition = margin;
      }

      doc.setFontSize(16);
      doc.text('Monthly Trends', margin, yPosition);
      yPosition += 15;

      const trendsData = data.monthlyTrends.slice(-6).map(item => [
        format(new Date(item.test_month), 'MMM yyyy'),
        item.test_count?.toString() || '0',
        `${(item.completion_rate || 0).toFixed(1)}%`,
        `${(item.abnormal_rate || 0).toFixed(1)}%`,
      ]);

      doc.autoTable({
        startY: yPosition,
        head: [['Month', 'Tests', 'Completion Rate', 'Abnormal Rate']],
        body: trendsData,
        margin: { left: margin, right: margin },
        styles: { fontSize: 9 },
        headStyles: { fillColor: [16, 185, 129] },
      });
    }

    // Save the PDF
    doc.save(`${options.title.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  }

  static async exportToCSV(data: ExportData, options: ExportOptions): Promise<void> {
    let csvContent = `${options.title}\n`;
    csvContent += `Generated: ${format(new Date(), 'PPP')}\n`;
    if (options.organizationName) {
      csvContent += `Organization: ${options.organizationName}\n`;
    }
    csvContent += '\n';

    // Executive Summary
    if (data.executiveSummary) {
      csvContent += 'Executive Summary\n';
      csvContent += 'Metric,Value\n';
      csvContent += `Total Patients,${data.executiveSummary.total_patients || 0}\n`;
      csvContent += `Total Companies,${data.executiveSummary.total_companies || 0}\n`;
      csvContent += `Total Examinations,${data.executiveSummary.total_examinations || 0}\n`;
      csvContent += `Completion Rate,${(data.executiveSummary.overall_completion_rate || 0).toFixed(1)}%\n`;
      csvContent += `Health Score,${data.executiveSummary.health_score || 0}\n`;
      csvContent += `Total Fit Workers,${data.executiveSummary.total_fit || 0}\n`;
      csvContent += '\n';
    }

    // Risk Assessment
    if (data.riskAssessment && data.riskAssessment.length > 0) {
      csvContent += 'Risk Assessment\n';
      csvContent += 'Company,Test Type,Risk Level,Test Count\n';
      data.riskAssessment.forEach(item => {
        csvContent += `"${item.company_name || 'N/A'}","${item.test_type || 'N/A'}","${item.risk_level || 'N/A'}",${item.test_count || 0}\n`;
      });
      csvContent += '\n';
    }

    // Monthly Trends
    if (data.monthlyTrends && data.monthlyTrends.length > 0) {
      csvContent += 'Monthly Trends\n';
      csvContent += 'Month,Test Count,Completion Rate,Abnormal Rate\n';
      data.monthlyTrends.forEach(item => {
        csvContent += `"${format(new Date(item.test_month), 'MMM yyyy')}",${item.test_count || 0},${(item.completion_rate || 0).toFixed(1)}%,${(item.abnormal_rate || 0).toFixed(1)}%\n`;
      });
      csvContent += '\n';
    }

    // Create and download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${options.title.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  static async exportData(data: ExportData, options: ExportOptions): Promise<void> {
    if (options.format === 'pdf') {
      await this.exportToPDF(data, options);
    } else if (options.format === 'csv') {
      await this.exportToCSV(data, options);
    }
  }
}

import React, { useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button"; 
import { Download, Mail, Printer, ChevronDown } from "lucide-react";
import html2pdf from 'html2pdf.js';
import { useReactToPrint } from 'react-to-print';
import { toPng } from 'html-to-image';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";

type EnhancedCertificateGeneratorProps = {
  extractedData: any;
  showWatermark?: boolean;
};

const EnhancedCertificateGenerator = ({
  extractedData,
  showWatermark = false
}: EnhancedCertificateGeneratorProps) => {
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [emailData, setEmailData] = useState({
    to: '',
    subject: 'Certificate of Fitness',
    message: 'Please find attached the Certificate of Fitness.'
  });
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [printWithWatermark, setPrintWithWatermark] = useState(true);
  
  // Reference to the certificate content for printing and PDF generation
  const certificateRef = useRef<HTMLDivElement>(null);

  const isChecked = (value: any, trueValues: string[] = ['yes', 'true', 'checked', '1', 'x']) => {
    if (value === undefined || value === null) return false;
    const stringValue = String(value).toLowerCase().trim();
    return trueValues.includes(stringValue);
  };

  const getValue = (obj: any, path: string, defaultValue: any = '') => {
    if (!obj || !path) return defaultValue;
    const keys = path.split('.');
    let current = obj;
    for (const key of keys) {
      if (current === undefined || current === null || typeof current !== 'object') {
        return defaultValue;
      }
      current = current[key];
    }
    return current !== undefined && current !== null ? current : defaultValue;
  };

  const extractDataFromMarkdown = (markdown: string): any => {
    if (!markdown) return {};
    console.log("Extracting data from markdown");
    const extracted: any = {
      patient: {},
      examination_results: {
        type: {},
        test_results: {}
      },
      certification: {},
      restrictions: {}
    };

    const nameMatch = markdown.match(/\*\*Initials & Surname\*\*:\s*(.*?)(?=\n|\r|$)/i);
    if (nameMatch && nameMatch[1]) extracted.patient.name = nameMatch[1].trim();
    const idMatch = markdown.match(/\*\*ID No\*\*:\s*(.*?)(?=\n|\r|$)/i);
    if (idMatch && idMatch[1]) extracted.patient.id_number = idMatch[1].trim();
    const companyMatch = markdown.match(/\*\*Company Name\*\*:\s*(.*?)(?=\n|\r|$)/i);
    if (companyMatch && companyMatch[1]) extracted.patient.company = companyMatch[1].trim();
    const jobTitleMatch = markdown.match(/\*\*Job Title\*\*:\s*(.*?)(?=\n|\r|$)/i);
    if (jobTitleMatch && jobTitleMatch[1]) extracted.patient.occupation = jobTitleMatch[1].trim();
    const examDateMatch = markdown.match(/\*\*Date of Examination\*\*:\s*(.*?)(?=\n|\r|$)/i);
    if (examDateMatch && examDateMatch[1]) extracted.examination_results.date = examDateMatch[1].trim();
    const expiryDateMatch = markdown.match(/\*\*Expiry Date\*\*:\s*(.*?)(?=\n|\r|$)/i);
    if (expiryDateMatch && expiryDateMatch[1]) extracted.certification.valid_until = expiryDateMatch[1].trim();

    extracted.examination_results.type.pre_employment = markdown.includes('**Pre-Employment**: [x]') || markdown.match(/PRE-EMPLOYMENT.*?\[\s*x\s*\]/is) !== null;
    extracted.examination_results.type.periodical = markdown.includes('**Periodical**: [x]') || markdown.match(/PERIODICAL.*?\[\s*x\s*\]/is) !== null;
    extracted.examination_results.type.exit = markdown.includes('**Exit**: [x]') || markdown.match(/EXIT.*?\[\s*x\s*\]/is) !== null;

    const testsMap = [{
      name: 'BLOODS',
      key: 'bloods'
    }, {
      name: 'FAR, NEAR VISION',
      key: 'far_near_vision'
    }, {
      name: 'SIDE & DEPTH',
      key: 'side_depth'
    }, {
      name: 'NIGHT VISION',
      key: 'night_vision'
    }, {
      name: 'Hearing',
      key: 'hearing'
    }, {
      name: 'Working at Heights',
      key: 'heights'
    }, {
      name: 'Lung Function',
      key: 'lung_function'
    }, {
      name: 'X-Ray',
      key: 'x_ray'
    }, {
      name: 'Drug Screen',
      key: 'drug_screen'
    }];
    
    testsMap.forEach(test => {
      const tableRegex = new RegExp(`\\| ${test.name}\\s*\\| \\[(x| )\\]\\s*\\| (.*?)\\|`, 'is');
      const tableMatch = markdown.match(tableRegex);
      const listRegex = new RegExp(`${test.name}.*?\\[(x| )\\].*?(\\d+\\/\\d+|Normal|N\\/A|\\d+-\\d+)`, 'is');
      const listMatch = markdown.match(listRegex);
      const htmlTableRegex = new RegExp(`<td>${test.name}</td>\\s*<td>\\[(x| )\\]</td>\\s*<td>(.*?)</td>`, 'is');
      const htmlTableMatch = markdown.match(htmlTableRegex);
      let isDone = false;
      let results = '';
      if (tableMatch) {
        isDone = tableMatch[1].trim() === 'x';
        results = tableMatch[2] ? tableMatch[2].trim() : '';
      } else if (listMatch) {
        isDone = listMatch[1].trim() === 'x';
        results = listMatch[2] ? listMatch[2].trim() : '';
      } else if (htmlTableMatch) {
        isDone = htmlTableMatch[1].trim() === 'x';
        results = htmlTableMatch[2] ? htmlTableMatch[2].trim() : '';
      }
      if (isDone || results) {
        extracted.examination_results.test_results[`${test.key}_done`] = isDone;
        extracted.examination_results.test_results[`${test.key}_results`] = results;
      }
    });

    const fitnessOptions = [{
      name: 'FIT',
      key: 'fit'
    }, {
      name: 'Fit with Restriction',
      key: 'fit_with_restrictions'
    }, {
      name: 'Fit with Condition',
      key: 'fit_with_condition'
    }, {
      name: 'Temporary Unfit',
      key: 'temporarily_unfit'
    }, {
      name: 'UNFIT',
      key: 'unfit'
    }];
    
    fitnessOptions.forEach(option => {
      const patterns = [
        new RegExp(`\\*\\*${option.name}\\*\\*: \\[(x| )\\]`, 'is'), 
        new RegExp(`<th>${option.name}</th>[\\s\\S]*?<td>\\[(x| )\\]</td>`, 'is'), 
        new RegExp(`\\| ${option.name}\\s*\\| \\[(x| )\\]`, 'is')
      ];

      let isSelected = false;
      for (const pattern of patterns) {
        const match = markdown.match(pattern);
        if (match && match[0].includes('[x]')) {
          isSelected = true;
          break;
        }
      }
      extracted.certification[option.key] = isSelected;
    });

    const restrictions = [{
      name: 'Heights',
      key: 'heights'
    }, {
      name: 'Dust Exposure',
      key: 'dust_exposure'
    }, {
      name: 'Motorized Equipment',
      key: 'motorized_equipment'
    }, {
      name: 'Wear Hearing Protection',
      key: 'wear_hearing_protection'
    }, {
      name: 'Confined Spaces',
      key: 'confined_spaces'
    }, {
      name: 'Chemical Exposure',
      key: 'chemical_exposure'
    }, {
      name: 'Wear Spectacles',
      key: 'wear_spectacles'
    }, {
      name: 'Remain on Treatment for Chronic Conditions',
      key: 'remain_on_treatment_for_chronic_conditions'
    }];
    
    restrictions.forEach(restriction => {
      const patterns = [
        new RegExp(`\\*\\*${restriction.name}\\*\\*: \\[(x| )\\]`, 'is'), 
        new RegExp(`<td>${restriction.name}</td>\\s*<td>\\[(x| )\\]</td>`, 'is'), 
        new RegExp(`\\| ${restriction.name}\\s*\\| \\[(x| )\\]`, 'is')
      ];

      let isSelected = false;
      for (const pattern of patterns) {
        const match = markdown.match(pattern);
        if (match && match[0].includes('[x]')) {
          isSelected = true;
          break;
        }
      }
      extracted.restrictions[restriction.key] = isSelected;
    });

    const followUpMatch = markdown.match(/Referred or follow up actions:(.*?)(?=\n|\r|$|<)/i);
    if (followUpMatch && followUpMatch[1]) extracted.certification.follow_up = followUpMatch[1].trim();
    const reviewDateMatch = markdown.match(/Review Date:(.*?)(?=\n|\r|$|<)/i);
    if (reviewDateMatch && reviewDateMatch[1]) extracted.certification.review_date = reviewDateMatch[1].trim();
    const commentsMatch = markdown.match(/Comments:(.*?)(?=\n\n|\r\n\r\n|$|<)/is);
    if (commentsMatch && commentsMatch[1]) {
      let comments = commentsMatch[1].trim();
      if (comments.replace(/<\/?[^>]+(>|$)/g, "").trim() === "N/A" || comments.replace(/<\/?[^>]+(>|$)/g, "").trim() === "") {
        extracted.certification.comments = "N/A";
      } else {
        extracted.certification.comments = comments;
      }
    }
    return extracted;
  };

  const getMarkdown = (data: any): string | null => {
    if (!data) return null;

    const possiblePaths = ['raw_response.data.markdown', 'extracted_data.raw_response.data.markdown', 'markdown', 'raw_markdown'];
    for (const path of possiblePaths) {
      const value = getValue(data, path);
      if (value && typeof value === 'string') {
        return value;
      }
    }

    const searchForMarkdown = (obj: any, path = ''): string | null => {
      if (!obj || typeof obj !== 'object') return null;
      if (obj.markdown && typeof obj.markdown === 'string') {
        return obj.markdown;
      }
      if (obj.raw_response && obj.raw_response.data && obj.raw_response.data.markdown) {
        return obj.raw_response.data.markdown;
      }
      if (obj.data && obj.data.markdown) {
        return obj.data.markdown;
      }
      for (const key in obj) {
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          const result = searchForMarkdown(obj[key], `${path}.${key}`);
          if (result) return result;
        }
      }
      return null;
    };
    
    const deepMarkdown = searchForMarkdown(data);
    if (deepMarkdown) return deepMarkdown;

    if (data.structured_data && data.structured_data.raw_content) {
      return data.structured_data.raw_content;
    }
    return null;
  };

  let structuredData: any = {};

  if (extractedData?.structured_data) {
    structuredData = extractedData.structured_data;
  } else if (extractedData?.extracted_data?.structured_data) {
    structuredData = extractedData.extracted_data.structured_data;
  } else {
    const markdown = getMarkdown(extractedData);
    if (markdown) {
      structuredData = extractDataFromMarkdown(markdown);
    } else {
      structuredData = extractedData || {};
    }
  }

  const patient = structuredData.patient || {};
  const examination = structuredData.examination_results || structuredData.medical_details || {};
  const restrictions = structuredData.restrictions || {};
  const certification = structuredData.certification || structuredData.fitness_assessment || {};
  const testResults = examination.test_results || examination.tests || {};

  const fitnessStatus = {
    fit: isChecked(certification.fit_for_duty) || isChecked(certification.fit),
    fitWithRestriction: isChecked(certification.fit_with_restrictions),
    fitWithCondition: isChecked(certification.fit_with_condition),
    temporarilyUnfit: isChecked(certification.temporarily_unfit),
    unfit: isChecked(certification.permanently_unfit) || isChecked(certification.unfit)
  };

  const medicalTests = {
    bloods: {
      done: isChecked(testResults.bloods_done) || isChecked(testResults.blood_test),
      results: getValue(testResults, 'bloods_results') || getValue(testResults, 'blood_test_results')
    },
    farNearVision: {
      done: isChecked(testResults.far_near_vision_done) || isChecked(testResults.vision_test),
      results: getValue(testResults, 'far_near_vision_results') || getValue(testResults, 'vision_results')
    },
    sideDepth: {
      done: isChecked(testResults.side_depth_done) || isChecked(testResults.peripheral_vision),
      results: getValue(testResults, 'side_depth_results') || getValue(testResults, 'peripheral_vision_results')
    },
    nightVision: {
      done: isChecked(testResults.night_vision_done) || isChecked(testResults.night_vision_test),
      results: getValue(testResults, 'night_vision_results')
    },
    hearing: {
      done: isChecked(testResults.hearing_done) || isChecked(testResults.hearing_test),
      results: getValue(testResults, 'hearing_results') || getValue(testResults, 'hearing_test_results')
    },
    heights: {
      done: isChecked(testResults.heights_done) || isChecked(testResults.working_at_heights),
      results: getValue(testResults, 'heights_results') || getValue(testResults, 'working_at_heights_results')
    },
    lungFunction: {
      done: isChecked(testResults.lung_function_done) || isChecked(testResults.pulmonary_function),
      results: getValue(testResults, 'lung_function_results') || getValue(testResults, 'pulmonary_function_results')
    },
    xRay: {
      done: isChecked(testResults.x_ray_done) || isChecked(testResults.chest_x_ray),
      results: getValue(testResults, 'x_ray_results') || getValue(testResults, 'chest_x_ray_results')
    },
    drugScreen: {
      done: isChecked(testResults.drug_screen_done) || isChecked(testResults.drug_screen_test),
      results: getValue(testResults, 'drug_screen_results')
    }
  };

  const restrictionsData = {
    heights: isChecked(restrictions.heights),
    dustExposure: isChecked(restrictions.dust_exposure),
    motorizedEquipment: isChecked(restrictions.motorized_equipment),
    hearingProtection: isChecked(restrictions.hearing_protection) || isChecked(restrictions.wear_hearing_protection),
    confinedSpaces: isChecked(restrictions.confined_spaces),
    chemicalExposure: isChecked(restrictions.chemical_exposure),
    wearSpectacles: isChecked(restrictions.wear_spectacles),
    chronicConditions: isChecked(restrictions.chronic_conditions) || isChecked(restrictions.remain_on_treatment_for_chronic_conditions)
  };

  const examinationType = {
    preEmployment: isChecked(examination.pre_employment) || isChecked(examination.type?.pre_employment),
    periodical: isChecked(examination.periodical) || isChecked(examination.type?.periodical),
    exit: isChecked(examination.exit) || isChecked(examination.type?.exit)
  };

  // Generate a filename based on patient data
  const getFileName = () => {
    const patientName = getValue(patient, 'name') || getValue(patient, 'full_name') || 'Unknown';
    const examDate = getValue(examination, 'date') || new Date().toISOString().split('T')[0];
    const sanitizedName = patientName.replace(/[^a-zA-Z0-9]/g, '_');
    return `Certificate_of_Fitness_${sanitizedName}_${examDate}`;
  };

  // Handle PDF download
  const handleDownloadPdf = async () => {
    if (!certificateRef.current) return;
    
    try {
      setIsGeneratingPdf(true);
      
      const element = certificateRef.current;
      const opt = {
        margin: [0, 0, 0, 0],
        filename: `${getFileName()}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      
      await html2pdf().set(opt).from(element).save();
      
      toast({
        title: "Success!",
        description: "Certificate downloaded as PDF.",
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Handle printing functionality
  const handlePrint = useReactToPrint({
    content: () => certificateRef.current,
    documentTitle: getFileName(),
    onBeforeGetContent: () => {
      // Add watermark before printing
      setPrintWithWatermark(true);
      
      toast({
        title: "Preparing to print...",
        description: "Getting document ready.",
      });
      return Promise.resolve();
    },
    onAfterPrint: () => {
      // Remove watermark after printing
      setPrintWithWatermark(false);
      
      toast({
        title: "Print job sent",
        description: "Document has been sent to the printer.",
      });
    },
    removeAfterPrint: true
  });

  // Handle email dialog
  const handleEmailOpen = () => {
    // Pre-populate email if patient has email
    if (patient.contact_info?.email) {
      setEmailData(prev => ({ ...prev, to: patient.contact_info.email }));
    }
    setIsEmailDialogOpen(true);
  };

  // Handle email sending
  const handleSendEmail = async () => {
    if (!certificateRef.current || !emailData.to) return;
    
    try {
      setIsGeneratingPdf(true);
      
      // Add watermark for email copies
      setPrintWithWatermark(true);
      
      // Small delay to ensure watermark is applied before capturing
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Generate image of certificate for email attachment
      const dataUrl = await toPng(certificateRef.current, { quality: 0.95, pixelRatio: 2 });
      
      // In a real implementation, you would send this to your backend
      // Here we'll mock a successful email send
      console.log("Would send email to:", emailData.to);
      console.log("With subject:", emailData.subject);
      console.log("With message:", emailData.message);
      console.log("With attachment:", dataUrl.substring(0, 100) + "...");
      
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "Email sent!",
        description: `Certificate sent to ${emailData.to}`,
      });
      
      setIsEmailDialogOpen(false);
    } catch (error) {
      console.error("Error sending email:", error);
      toast({
        title: "Error",
        description: "Failed to send email. Please try again.",
        variant: "destructive"
      });
    } finally {
      // Remove watermark after email is sent
      setPrintWithWatermark(false);
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4">
        <h2 className="text-xl font-semibold">Certificate Generator</h2>
        <p className="text-sm text-muted-foreground">Generate a printable certificate from the extracted data</p>
      </div>
      
      {/* Action buttons - fixed at top */}
      <div className="sticky top-0 z-10 flex justify-center gap-3 py-3 bg-gray-50 border-b">
        <div className="flex">
          <Button 
            variant="outline" 
            onClick={handleDownloadPdf} 
            disabled={isGeneratingPdf}
            className="flex items-center gap-2 rounded-r-none border-r-0"
          >
            <Download size={16} />
            {isGeneratingPdf ? "Generating..." : "Download PDF"}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                disabled={isGeneratingPdf}
                className="rounded-l-none px-2"
              >
                <ChevronDown size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={handleDownloadPdf}>
                PDF Document
              </DropdownMenuItem>
              <DropdownMenuItem onClick={async () => {
                if (!certificateRef.current) return;
                try {
                  setIsGeneratingPdf(true);
                  const dataUrl = await toPng(certificateRef.current, { quality: 0.95, pixelRatio: 2 });
                  const link = document.createElement('a');
                  link.download = `${getFileName()}.png`;
                  link.href = dataUrl;
                  link.click();
                  toast({ title: "Success!", description: "Certificate downloaded as PNG." });
                } catch (e) {
                  console.error(e);
                  toast({ 
                    title: "Error", 
                    description: "Failed to generate PNG. Please try again.", 
                    variant: "destructive" 
                  });
                } finally {
                  setIsGeneratingPdf(false);
                }
              }}>
                PNG Image
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <Button 
          variant="outline" 
          onClick={handlePrint} 
          className="flex items-center gap-2"
        >
          <Printer size={16} />
          Print
        </Button>
        <Button 
          variant="outline" 
          onClick={handleEmailOpen} 
          className="flex items-center gap-2"
        >
          <Mail size={16} />
          Email
        </Button>
      </div>
      
      <ScrollArea className="h-full">
        <Card className="border-0 shadow-none bg-white w-full max-w-3xl mx-auto font-sans text-black">
          <div className="relative overflow-hidden" ref={certificateRef}>
          <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none" aria-hidden="true">
            <span className="text-8xl font-bold tracking-widest text-gray-400 rotate-45">
              OCCUPATIONAL HEALTH
            </span>
          </div>
          
          {/* Show watermark for copies */}
          {(showWatermark || printWithWatermark) && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10" aria-hidden="true">
              <span className="text-9xl font-extrabold text-red-500 opacity-20 rotate-45">
                COPY
              </span>
            </div>
          )}
          
          <div className="relative z-10">
            <div className="px-4 pt-4">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <img 
                    src="/lovable-uploads/b75ebd30-51c1-441a-8b04-eec2746a7ebd.png" 
                    alt="BlueCollar Health & Wellness Logo" 
                    className="h-20 object-contain"
                  />
                </div>
                <div className="bg-white text-right">
                  <div className="text-sm font-bold bg-gray-800 text-white px-3 py-1 text-right">BLUECOLLAR OCCUPATIONAL HEALTH</div>
                  <div className="text-[0.65rem] mt-1 px-3 text-black text-right">Tel: +27 11 892 0771/011 892 0627</div>
                  <div className="text-[0.65rem] px-3 text-black text-right">Email: admin@bluecollarhealth.co.za</div>
                  <div className="text-[0.65rem] px-3 text-black text-right">office@bluecollarhealth.co.za</div>
                  <div className="text-[0.65rem] px-3 text-black text-right">135 Leeuwpoort Street, Boksburg South, Boksburg</div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-800 text-white text-center py-2 mb-2">
              <h2 className="text-lg font-bold">CERTIFICATE OF FITNESS</h2>
            </div>
            
            <div className="text-center text-xs px-4 mb-3">
              <p>
                Dr. {getValue(examination, 'physician') || getValue(certification, 'certifying_physician') || 'MJ Mphuthi'} / Practice No: {getValue(examination, 'practice_number') || '0404160'} / Sr. {getValue(examination, 'nurse') || 'Sibongile Mahlangu'} / Practice No: {getValue(examination, 'nurse_practice_number') || '999 088 0000 8177 91'}
              </p>
              <p>certify that the following employee:</p>
            </div>
            
            <div className="px-4 space-y-4 mb-4">
              <div className="flex justify-between space-x-4">
                <div className="flex-1">
                  <div className="flex items-center">
                    <span className="font-semibold mr-1">Initials & Surname:</span>
                    <span className="border-b border-gray-400 flex-1">{getValue(patient, 'name') || getValue(patient, 'full_name')}</span>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center">
                    <span className="font-semibold mr-1">ID NO:</span>
                    <span className="border-b border-gray-400 flex-1">{getValue(patient, 'id_number') || getValue(patient, 'employee_id') || getValue(patient, 'id')}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center">
                <span className="font-semibold mr-1">Company Name:</span>
                <span className="border-b border-gray-400 flex-1">{getValue(patient, 'company') || getValue(patient, 'employer') || getValue(patient, 'employment.employer')}</span>
              </div>
              
              <div className="flex justify-between space-x-4">
                <div className="flex-1">
                  <div className="flex items-center">
                    <span className="font-semibold mr-1">Date of Examination:</span>
                    <span className="border-b border-gray-400 flex-1">{getValue(examination, 'date') || getValue(extractedData, 'examination_date')}</span>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center">
                    <span className="font-semibold mr-1">Expiry Date:</span>
                    <span className="border-b border-gray-400 flex-1">{getValue(certification, 'valid_until') || getValue(certification, 'expiration_date')}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center">
                <span className="font-semibold mr-1">Job Title:</span>
                <span className="border-b border-gray-400 flex-1">{getValue(patient, 'occupation') || getValue(patient, 'job_title') || getValue(patient, 'employment.occupation')}</span>
              </div>
            </div>
            
            <div className="px-4 mb-4">
              <table className="w-full border border-gray-400">
                <thead>
                  <tr>
                    <th className="border border-gray-400 py-1 w-1/3 text-center bg-gray-100 text-sm">PRE-EMPLOYMENT</th>
                    <th className="border border-gray-400 py-1 w-1/3 text-center bg-gray-100 text-sm">PERIODICAL</th>
                    <th className="border border-gray-400 py-1 w-1/3 text-center bg-gray-100 text-sm">EXIT</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-400 h-8 text-center">
                      {examinationType.preEmployment ? '✓' : ''}
                    </td>
                    <td className="border border-gray-400 h-8 text-center">
                      {examinationType.periodical ? '✓' : ''}
                    </td>
                    <td className="border border-gray-400 h-8 text-center">
                      {examinationType.exit ? '✓' : ''}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div className="mb-4">
              <div className="bg-gray-800 text-white text-center py-1 text-sm font-semibold mb-2">
                MEDICAL EXAMINATION CONDUCTED INCLUDES THE FOLLOWING TESTS
              </div>
              
              <div className="px-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <table className="w-full border border-gray-400">
                      <thead>
                        <tr>
                          <th className="border border-gray-400 py-1 w-1/3 text-left pl-2 bg-blue-50 text-sm">BLOODS</th>
                          <th className="border border-gray-400 py-1 w-1/6 text-center bg-blue-50 text-xs">Done</th>
                          <th className="border border-gray-400 py-1 text-center bg-blue-50 text-xs">Results</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-gray-400 pl-2 text-sm">BLOODS</td>
                          <td className="border border-gray-400 text-center">
                            {medicalTests.bloods.done ? '✓' : ''}
                          </td>
                          <td className="border border-gray-400 p-1 text-sm">
                            {medicalTests.bloods.results}
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-400 pl-2 text-sm">FAR, NEAR VISION</td>
                          <td className="border border-gray-400 text-center">
                            {medicalTests.farNearVision.done ? '✓' : ''}
                          </td>
                          <td className="border border-gray-400 p-1 text-sm">
                            {medicalTests.farNearVision.results}
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-400 pl-2 text-sm">SIDE & DEPTH</td>
                          <td className="border border-gray-400 text-center">
                            {medicalTests.sideDepth.done ? '✓' : ''}
                          </td>
                          <td className="border border-gray-400 p-1 text-sm">
                            {medicalTests.sideDepth.results}
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-400 pl-2 text-sm">NIGHT VISION</td>
                          <td className="border border-gray-400 text-center">
                            {medicalTests.nightVision.done ? '✓' : ''}
                          </td>
                          <td className="border border-gray-400 p-1 text-sm">
                            {medicalTests.nightVision.results}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div>
                    <table className="w-full border border-gray-400">
                      <thead>
                        <tr>
                          <th className="border border-gray-400 py-1 text-left pl-2 bg-blue-50 text-sm">Hearing</th>
                          <th className="border border-gray-400 py-1 w-1/6 text-center bg-blue-50 text-xs">Done</th>
                          <th className="border border-gray-400 py-1 text-center bg-blue-50 text-xs">Results</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-gray-400 pl-2 text-sm">Hearing</td>
                          <td className="border border-gray-400 text-center">
                            {medicalTests.hearing.done ? '✓' : ''}
                          </td>
                          <td className="border border-gray-400 p-1 text-sm">
                            {medicalTests.hearing.results}
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-400 pl-2 text-sm">Working at Heights</td>
                          <td className="border border-gray-400 text-center">
                            {medicalTests.heights.done ? '✓' : ''}
                          </td>
                          <td className="border border-gray-400 p-1 text-sm">
                            {medicalTests.heights.results}
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-400 pl-2 text-sm">Lung Function</td>
                          <td className="border border-gray-400 text-center">
                            {medicalTests.lungFunction.done ? '✓' : ''}
                          </td>
                          <td className="border border-gray-400 p-1 text-sm">
                            {medicalTests.lungFunction.results}
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-400 pl-2 text-sm">X-Ray</td>
                          <td className="border border-gray-400 text-center">
                            {medicalTests.xRay.done ? '✓' : ''}
                          </td>
                          <td className="border border-gray-400 p-1 text-sm">
                            {medicalTests.xRay.results}
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-400 pl-2 text-sm">Drug Screen</td>
                          <td className="border border-gray-400 text-center">
                            {medicalTests.drugScreen.done ? '✓' : ''}
                          </td>
                          <td className="border border-gray-400 p-1 text-sm">
                            {medicalTests.drugScreen.results}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="px-4 mb-4">
              <div className="flex items-center">
                <div className="font-semibold text-sm mr-1">Referred or follow up actions:</div>
                <div className="border-b border-gray-400 flex-1">
                  {getValue(certification, 'follow_up') || getValue(certification, 'referral')}
                </div>
                <div className="ml-2">
                  <div className="text-sm">
                    <span className="font-semibold mr-1">Review Date:</span>
                    <span className="text-red-600">{getValue(certification, 'review_date')}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mb-4">
              <div className="bg-gray-800 text-white text-center py-1 text-sm font-semibold mb-2">
                Restrictions:
              </div>
              
              <div className="px-4">
                <table className="w-full border border-gray-400 text-sm">
                  <tbody>
                    <tr>
                      <td className={`border border-gray-400 p-2 text-center ${restrictionsData.heights ? 'bg-yellow-100' : ''}`}>
                        <div className="font-semibold">Heights</div>
                        {restrictionsData.heights && <div className="text-xs">✓</div>}
                      </td>
                      <td className={`border border-gray-400 p-2 text-center ${restrictionsData.dustExposure ? 'bg-yellow-100' : ''}`}>
                        <div className="font-semibold">Dust Exposure</div>
                        {restrictionsData.dustExposure && <div className="text-xs">✓</div>}
                      </td>
                      <td className={`border border-gray-400 p-2 text-center ${restrictionsData.motorizedEquipment ? 'bg-yellow-100' : ''}`}>
                        <div className="font-semibold">Motorized Equipment</div>
                        {restrictionsData.motorizedEquipment && <div className="text-xs">✓</div>}
                      </td>
                      <td className={`border border-gray-400 p-2 text-center ${restrictionsData.hearingProtection ? 'bg-yellow-100' : ''}`}>
                        <div className="font-semibold">Wear Hearing Protection</div>
                        {restrictionsData.hearingProtection && <div className="text-xs">✓</div>}
                      </td>
                    </tr>
                    <tr>
                      <td className={`border border-gray-400 p-2 text-center ${restrictionsData.confinedSpaces ? 'bg-yellow-100' : ''}`}>
                        <div className="font-semibold">Confined Spaces</div>
                        {restrictionsData.confinedSpaces && <div className="text-xs">✓</div>}
                      </td>
                      <td className={`border border-gray-400 p-2 text-center ${restrictionsData.chemicalExposure ? 'bg-yellow-100' : ''}`}>
                        <div className="font-semibold">Chemical Exposure</div>
                        {restrictionsData.chemicalExposure && <div className="text-xs">✓</div>}
                      </td>
                      <td className={`border border-gray-400 p-2 text-center ${restrictionsData.wearSpectacles ? 'bg-yellow-100' : ''}`}>
                        <div className="font-semibold">Wear Spectacles</div>
                        {restrictionsData.wearSpectacles && <div className="text-xs">✓</div>}
                      </td>
                      <td className={`border border-gray-400 p-2 text-center ${restrictionsData.chronicConditions ? 'bg-yellow-100' : ''}`}>
                        <div className="font-semibold">Remain on Treatment for Chronic Conditions</div>
                        {restrictionsData.chronicConditions && <div className="text-xs">✓</div>}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Moved Fitness Assessment to be before Comments section */}
            <div className="mb-2">
              <div className="bg-gray-800 text-white text-center py-1 text-xs font-semibold mb-1">
                FITNESS ASSESSMENT
              </div>
              
              <div className="px-4">
                <table className="w-full border border-gray-400">
                  <tbody>
                    <tr>
                      <th className={`border border-gray-400 p-2 text-center ${fitnessStatus.fit ? 'bg-green-100' : ''}`}>
                        FIT
                        {fitnessStatus.fit && <div className="text-green-600 text-lg">✓</div>}
                      </th>
                      <th className={`border border-gray-400 p-2 text-center ${fitnessStatus.fitWithRestriction ? 'bg-yellow-100' : ''}`}>
                        Fit with Restriction
                        {fitnessStatus.fitWithRestriction && <div className="text-yellow-600 text-lg">✓</div>}
                      </th>
                      <th className={`border border-gray-400 p-2 text-center ${fitnessStatus.fitWithCondition ? 'bg-yellow-100' : ''}`}>
                        Fit with Condition
                        {fitnessStatus.fitWithCondition && <div className="text-yellow-600 text-lg">✓</div>}
                      </th>
                      <th className={`border border-gray-400 p-2 text-center ${fitnessStatus.temporarilyUnfit ? 'bg-red-100' : ''}`}>
                        Temporary Unfit
                        {fitnessStatus.temporarilyUnfit && <div className="text-red-600 text-lg">✓</div>}
                      </th>
                      <th className={`border border-gray-400 p-2 text-center ${fitnessStatus.unfit ? 'bg-red-100' : ''}`}>
                        UNFIT
                        {fitnessStatus.unfit && <div className="text-red-600 text-lg">✓</div>}
                      </th>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Moved Comments section to be the last section before the signature */}
            <div className="px-4 mb-1">
              <div className="font-semibold text-xs mb-0.5">Comments:</div>
              <div className="border border-gray-400 p-1 min-h-8 text-xs">
                {getValue(certification, 'comments')}
              </div>
            </div>
            
            <div className="px-4 mb-1">
              <div className="flex justify-between items-end">
                <div className="flex-1">
                  <div className="border-t border-gray-400 pt-1 mt-4 max-w-56">
                    <div className="text-center font-semibold text-[0.6rem]">SIGNATURE</div>
                  </div>
                </div>
                
                <div className="flex-1 px-2 flex justify-center">
                  <div className="w-fit max-w-md text-center">
                    <p className="text-[0.6rem] leading-tight font-semibold">Occupational Health Practitioner / Occupational Medical Practitioner</p>
                    <p className="text-[0.6rem] leading-tight italic">Dr {getValue(examination, 'physician') || getValue(certification, 'certifying_physician') || 'MJ Mphuthi'} / Practice No. {getValue(examination, 'practice_number') || '0404160'}</p>
                    <p className="text-[0.6rem] leading-tight">Sr. {getValue(examination, 'nurse') || 'Sibongile Mahlangu'}</p>
                    <p className="text-[0.6rem] leading-tight">SANC No: 14262133; SASOHN No: AR 2136</p>
                    <p className="text-[0.6rem] leading-tight">Practice Number: {getValue(examination, 'nurse_practice_number') || '999 088 0000 8177 91'}</p>
                  </div>
                </div>
                
                <div className="flex-1 text-right">
                  <div className="border-t border-gray-400 pt-1 mt-4 max-w-56 ml-auto">
                    <div className="text-center font-semibold text-[0.6rem]">STAMP</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-800 text-white text-center px-1 text-[0.55rem] leading-none py-1">
              © {new Date().getFullYear()} BlueCollar Health & Wellness
            </div>
          </div>
        </div>
      </Card>
    </ScrollArea>
    
    {/* Email Dialog */}
    <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Email Certificate</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">
              To
            </Label>
            <Input
              id="email"
              type="email"
              value={emailData.to}
              onChange={(e) => setEmailData(prev => ({ ...prev, to: e.target.value }))}
              placeholder="recipient@example.com"
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="subject" className="text-right">
              Subject
            </Label>
            <Input
              id="subject"
              value={emailData.subject}
              onChange={(e) => setEmailData(prev => ({ ...prev, subject: e.target.value }))}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="message" className="text-right align-top pt-2">
              Message
            </Label>
            <Textarea
              id="message"
              value={emailData.message}
              onChange={(e) => setEmailData(prev => ({ ...prev, message: e.target.value }))}
              className="col-span-3"
              rows={4}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsEmailDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleSendEmail} 
            disabled={!emailData.to || isGeneratingPdf}
          >
            {isGeneratingPdf ? "Sending..." : "Send Email"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
  );
};

export default EnhancedCertificateGenerator;
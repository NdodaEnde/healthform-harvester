import React, { useState, useCallback } from 'react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { useToast } from "@/components/ui/use-toast"
import { useDebounce } from "@/hooks/use-debounce"
import { useCertificateData } from "@/hooks/useCertificateData"
import { useDocumentProcessing } from "@/hooks/useDocumentProcessing";
import { saveAs } from 'file-saver';
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

interface CertificateGeneratorProps {
  initialCertificateId?: string;
}

const EnhancedCertificateGenerator: React.FC<CertificateGeneratorProps> = ({ initialCertificateId }) => {
  const [certificateId, setCertificateId] = useState<string>(initialCertificateId || "");
  const debouncedCertificateId = useDebounce(certificateId, 500);
  const { certificate, isLoading, error, isValidCertificateId } = useCertificateData(debouncedCertificateId);
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isProcessingPDF, setIsProcessingPDF] = useState(false);
  const [processedData, setProcessedData] = useState<any>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [pdfGenerationProgress, setPdfGenerationProgress] = useState(0);
  const [isAIDataVisible, setIsAIDataVisible] = useState(false);
  const [aiQuery, setAiQuery] = useState("");
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const [aiResults, setAIResults] = useState<any>(null);
  const [isAIDisabled, setIsAIDisabled] = useState(false);
  const [isSDKProcessing, setIsSDKProcessing] = useState(false);
  const [sdkProcessingProgress, setSDKProcessingProgress] = useState(0);
  const [isSDKDataVisible, setIsSDKDataVisible] = useState(false);
  const [sdkResults, setSDKResults] = useState<any>(null);
  const [isSDKError, setIsSDKError] = useState(false);
  const [sdkErrorMessage, setSDKErrorMessage] = useState<string>("");
  const [isLocalProcessing, setIsLocalProcessing] = useState(false);
  const [localProcessingProgress, setLocalProcessingProgress] = useState(0);
  const [isLocalDataVisible, setIsLocalDataVisible] = useState(false);
  const [localResults, setLocalResults] = useState<any>(null);
	const [isLocalError, setIsLocalError] = useState(false);
	const [localErrorMessage, setLocalErrorMessage] = useState<string>("");
  const { toast } = useToast()
	const { processDocument, isProcessing, processingProgress } = useDocumentProcessing();

  const s3Client = new S3Client({
    region: process.env.NEXT_PUBLIC_AWS_REGION || '',
    credentials: {
      accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY || '',
    },
  });

  const handleCertificateIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCertificateId(e.target.value);
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPageNumber(1);
    setIsPdfLoading(false);
  };

  const changePage = (offset: number) => {
    setPageNumber((prevPageNumber) => {
      const newPageNumber = prevPageNumber + offset;
      if (newPageNumber >= 1 && newPageNumber <= numPages!) {
        return newPageNumber;
      } else {
        return prevPageNumber;
      }
    });
  };

  const changePageBack = () => {
    changePage(-1);
  };

  const changePageNext = () => {
    changePage(1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files && event.target.files[0];
    if (file) {
      setUploadedFile(file);
    } else {
      setUploadedFile(null);
    }
  };

  const handleDocumentProcessing = (file: File, query?: string) => {
    return processDocument(file, query).catch(error => {
      console.error("Error processing document:", error);
      toast({
        title: "Document Processing Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
      
      // Rethrow to maintain Promise rejection chain
      throw error;
    });
  };

  const handleUpload = async () => {
    if (!uploadedFile) {
      toast({
        title: "No file selected",
        description: "Please select a PDF file to upload",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append("file", uploadedFile);

      const xhr = new XMLHttpRequest();
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(progress);
        }
      });

      xhr.open("POST", "/api/upload-pdf");
      xhr.send(formData);

      xhr.onload = () => {
        if (xhr.status === 200) {
          toast({
            title: "Upload successful",
            description: "The PDF file has been successfully uploaded.",
          });
        } else {
          toast({
            title: "Upload failed",
            description: "There was an error uploading the PDF file.",
            variant: "destructive",
          });
        }
        setIsUploading(false);
      };

      xhr.onerror = () => {
        toast({
          title: "Upload error",
          description: "There was a network error during the upload.",
          variant: "destructive",
        });
        setIsUploading(false);
      };
    } catch (error) {
      console.error("Error uploading PDF:", error);
      toast({
        title: "Upload error",
        description: "There was an error uploading the PDF file.",
        variant: "destructive",
      });
      setIsUploading(false);
    }
  };

  const handleDownload = async () => {
    if (!certificate?.file_path) {
      toast({
        title: "File not found",
        description: "The file path is not available.",
        variant: "destructive",
      });
      return;
    }

    setIsDownloading(true);
    setDownloadProgress(0);

    try {
      const filePath = certificate.file_path;
      const bucket = process.env.NEXT_PUBLIC_AWS_BUCKET_NAME;

      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: filePath,
      });

      const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

      const xhr = new XMLHttpRequest();
      xhr.open('GET', url, true);
      xhr.responseType = 'blob';

      xhr.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setDownloadProgress(progress);
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          const blob = new Blob([xhr.response], { type: 'application/pdf' });
          saveAs(blob, certificate.file_name || 'certificate.pdf');
          toast({
            title: "Download successful",
            description: "The PDF file has been successfully downloaded.",
          });
        } else {
          toast({
            title: "Download failed",
            description: "There was an error downloading the PDF file.",
            variant: "destructive",
          });
        }
        setIsDownloading(false);
      };

      xhr.onerror = () => {
        toast({
          title: "Download error",
          description: "There was a network error during the download.",
          variant: "destructive",
        });
        setIsDownloading(false);
      };

      xhr.send();
    } catch (error) {
      console.error("Error downloading PDF:", error);
      toast({
        title: "Download error",
        description: "There was an error downloading the PDF file.",
        variant: "destructive",
      });
      setIsDownloading(false);
    }
  };

  const generatePdf = () => {
    if (!certificate) {
      toast({
        title: "No certificate data",
        description: "Please load certificate data first.",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingPDF(true);
    setPdfGenerationProgress(0);

    const doc = new jsPDF();
    const lineHeight = 10;
    let currentY = 20;

    const addText = (text: string, style: string = 'normal') => {
      doc.setFontSize(12);
      doc.setFont('helvetica', style);
      const textLines = doc.splitTextToSize(text, doc.internal.pageSize.getWidth() - 20);
      textLines.forEach(line => {
        doc.text(line, 10, currentY);
        currentY += lineHeight;
      });
    };

    try {
      // Simulate progress
      const interval = setInterval(() => {
        setPdfGenerationProgress((prevProgress) => {
          const newProgress = prevProgress + 10;
          if (newProgress >= 100) {
            clearInterval(interval);

            // Add content to the PDF
            addText(`Certificate ID: ${certificate.id}`, 'bold');
            addText(`File Name: ${certificate.file_name}`);
            addText(`Document Type: ${certificate.document_type}`);
            addText(`Status: ${certificate.status}`);
            addText(`Created At: ${certificate.created_at}`);

            // Add extracted data
            if (certificate.extracted_data) {
              addText("\nExtracted Data:", 'bold');
              addText(JSON.stringify(certificate.extracted_data, null, 2));
            }

            // Save the PDF
            doc.save('certificate.pdf');
            setIsGeneratingPDF(false);
            toast({
              title: "PDF generated",
              description: "The PDF file has been successfully generated.",
            });
            return 100;
          }
          return newProgress;
        });
      }, 200);
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "PDF generation error",
        description: "There was an error generating the PDF file.",
        variant: "destructive",
      });
      setIsGeneratingPDF(false);
    }
  };

  const handleAIAnalysis = async () => {
    if (!certificate?.extracted_data) {
      toast({
        title: "No extracted data",
        description: "Please load certificate data with extracted data first.",
        variant: "destructive",
      });
      return;
    }

    if (!aiQuery) {
      toast({
        title: "No query provided",
        description: "Please enter a query for AI analysis.",
        variant: "destructive",
      });
      return;
    }

    setIsAIProcessing(true);
    setAIResults(null);

    try {
      // Simulate AI processing
      setTimeout(() => {
        const mockAIResults = {
          answer: "This is a mock AI analysis result based on the query.",
          reasoning: "The AI has reasoned through the extracted data to provide this answer.",
          relevantData: certificate.extracted_data,
        };
        setAIResults(mockAIResults);
        setIsAIProcessing(false);
        setIsAIDataVisible(true);
        toast({
          title: "AI analysis complete",
          description: "The AI analysis has been completed.",
        });
      }, 2000);
    } catch (error) {
      console.error("Error during AI analysis:", error);
      toast({
        title: "AI analysis error",
        description: "There was an error during the AI analysis.",
        variant: "destructive",
      });
      setIsAIProcessing(false);
    }
  };

  const handleSDKProcessing = async () => {
    if (!uploadedFile) {
      toast({
        title: "No file selected",
        description: "Please select a PDF file to process with the SDK",
        variant: "destructive",
      });
      return;
    }

    setIsSDKProcessing(true);
    setSDKProcessingProgress(0);
    setSDKResults(null);
    setIsSDKError(false);
    setSDKErrorMessage("");

    try {
      // Simulate SDK processing
      setTimeout(() => {
        const mockSDKResults = {
          extractedData: {
            field1: "Mock SDK Data 1",
            field2: "Mock SDK Data 2",
          },
          metadata: {
            processedOn: new Date().toISOString(),
          },
        };
        setSDKResults(mockSDKResults);
        setSDKProcessingProgress(100);
        setIsSDKProcessing(false);
        setIsSDKDataVisible(true);
        toast({
          title: "SDK processing complete",
          description: "The SDK processing has been completed.",
        });
      }, 3000);
    } catch (error: any) {
      console.error("Error during SDK processing:", error);
      setIsSDKError(true);
      setSDKErrorMessage(error.message || "Unknown error occurred");
      setIsSDKProcessing(false);
      toast({
        title: "SDK processing error",
        description: "There was an error during the SDK processing.",
        variant: "destructive",
      });
    }
  };

  const handleLocalProcessing = async () => {
    if (!uploadedFile) {
      toast({
        title: "No file selected",
        description: "Please select a PDF file to process locally",
        variant: "destructive",
      });
      return;
    }

    setIsLocalProcessing(true);
    setLocalProcessingProgress(0);
    setLocalResults(null);
		setIsLocalError(false);
		setLocalErrorMessage("");

    try {
      await handleDocumentProcessing(uploadedFile, aiQuery.length > 0 ? aiQuery : undefined);
      
      setLocalProcessingProgress(100);
      
      toast({
        title: "Document processed with SDK",
        description: "Your document has been analyzed using the agentic-doc SDK",
      });
      
    } catch (error: any) {
      console.error("Error processing with SDK:", error);
			setIsLocalError(true);
			setLocalErrorMessage(error.message || "Failed to process document with SDK");
      toast({
        title: "SDK Processing Failed",
        description: error instanceof Error ? error.message : "Failed to process document with SDK",
        variant: "destructive"
      });
    } finally {
      setIsLocalProcessing(false);
    }
  };

  const getLocalProgressPercentage = () => {
    if (isLocalProcessing && processingProgress) {
      return processingProgress;
    }
    return localProcessingProgress;
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Enhanced Certificate Generator</h1>

      {/* Certificate ID Input */}
      <div className="mb-4">
        <Label htmlFor="certificateId">Certificate ID</Label>
        <Input
          id="certificateId"
          type="text"
          placeholder="Enter certificate ID"
          value={certificateId}
          onChange={handleCertificateIdChange}
        />
      </div>

      {/* Load Certificate Button */}
      <div className="mb-4">
        <Button onClick={() => { }} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <span>Loading...</span>
            </>
          ) : (
            "Load Certificate"
          )}
        </Button>
        {error && (
          <p className="text-red-500 mt-2">
            Error: {error}
          </p>
        )}
        {isValidCertificateId === false && !isLoading && (
          <p className="text-red-500 mt-2">
            Invalid Certificate ID
          </p>
        )}
      </div>

      {/* Certificate Data Display */}
      {certificate ? (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Certificate Details</CardTitle>
            <CardDescription>
              View the details of the loaded certificate.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div>
                <Label>File Name</Label>
                <p className="text-sm font-medium">{certificate.file_name}</p>
              </div>
              <div>
                <Label>Document Type</Label>
                <p className="text-sm font-medium">{certificate.document_type}</p>
              </div>
              <div>
                <Label>Status</Label>
                <Badge variant="secondary">{certificate.status}</Badge>
              </div>
              <div>
                <Label>Created At</Label>
                <p className="text-sm font-medium">{certificate.created_at}</p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button onClick={handleDownload} disabled={isDownloading}>
              {isDownloading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span>Downloading... {downloadProgress}%</span>
                </>
              ) : (
                "Download PDF"
              )}
            </Button>
            <Button onClick={generatePdf} disabled={isGeneratingPDF}>
              {isGeneratingPDF ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span>Generating PDF... {pdfGenerationProgress}%</span>
                </>
              ) : (
                "Generate PDF"
              )}
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Certificate Details</CardTitle>
            <CardDescription>
              Load a certificate to view its details.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Skeleton className="h-4 w-[200px]" />
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[150px]" />
            <Skeleton className="h-4 w-[300px]" />
          </CardContent>
        </Card>
      )}

      {/* PDF Viewer */}
      {certificate?.file_path && (
        <div className="mb-4">
          <Label>PDF Viewer</Label>
          <Card>
            <CardContent>
              {isPdfLoading && <p>Loading PDF...</p>}
              <Document
                file={`https://medical-certs.s3.ap-southeast-2.amazonaws.com/${certificate.file_path}`}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={console.error}
                loading={<p>Loading PDF...</p>}
              >
                <Page pageNumber={pageNumber} renderAnnotationLayer={false} renderTextLayer={false} />
              </Document>
              <div className="flex justify-between mt-2">
                <Button onClick={changePageBack} disabled={pageNumber <= 1}>
                  Prev
                </Button>
                <p>
                  Page {pageNumber || (numPages ? 1 : "--")} of {numPages || "--"}
                </p>
                <Button
                  onClick={changePageNext}
                  disabled={pageNumber >= numPages!}
                >
                  Next
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search Bar */}
      <div className="mb-4">
        <Label htmlFor="searchTerm">Search in PDF</Label>
        <Input
          type="text"
          id="searchTerm"
          placeholder="Enter search term"
          value={searchTerm}
          onChange={handleSearchChange}
        />
        {debouncedSearchTerm && (
          <p className="mt-2">
            Searching for: <strong>{debouncedSearchTerm}</strong>
          </p>
        )}
        {searchResults.length > 0 && (
          <div className="mt-2">
            <Label>Search Results</Label>
            <ul>
              {searchResults.map((result, index) => (
                <li key={index}>{result}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Upload PDF Section */}
      <div className="mb-4">
        <Label htmlFor="pdfUpload">Upload PDF for Processing</Label>
        <Input type="file" id="pdfUpload" accept=".pdf" onChange={handleFileChange} />
        {uploadedFile && (
          <p className="mt-2">
            Selected File: {uploadedFile.name} ({uploadedFile.size} bytes)
          </p>
        )}
        <Button onClick={handleUpload} disabled={isUploading}>
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <span>Uploading... {uploadProgress}%</span>
            </>
          ) : (
            "Upload PDF"
          )}
        </Button>
      </div>

      {/* AI Analysis Section */}
      <div className="mb-4">
        <Label htmlFor="aiQuery">AI Analysis Query</Label>
        <Input
          type="text"
          id="aiQuery"
          placeholder="Enter your query for AI analysis"
          value={aiQuery}
          onChange={(e) => setAiQuery(e.target.value)}
          disabled={isAIDisabled}
        />
        <Button onClick={handleAIAnalysis} disabled={isAIProcessing || isAIDisabled}>
          {isAIProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <span>Processing AI Analysis...</span>
            </>
          ) : (
            "Run AI Analysis"
          )}
        </Button>
        {isAIDataVisible && aiResults && (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>AI Analysis Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div>
                  <Label>Answer</Label>
                  <p className="text-sm font-medium">{aiResults.answer}</p>
                </div>
                <div>
                  <Label>Reasoning</Label>
                  <p className="text-sm font-medium">{aiResults.reasoning}</p>
                </div>
                <div>
                  <Label>Relevant Data</Label>
                  <pre className="text-xs">{JSON.stringify(aiResults.relevantData, null, 2)}</pre>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* SDK Processing Section */}
      <div className="mb-4">
        <Label>SDK Processing</Label>
        <Button onClick={handleSDKProcessing} disabled={isSDKProcessing}>
          {isSDKProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <span>Processing with SDK... {sdkProcessingProgress}%</span>
            </>
          ) : (
            "Process with SDK"
          )}
        </Button>
        {isSDKError && (
          <p className="text-red-500 mt-2">
            SDK Error: {sdkErrorMessage}
          </p>
        )}
        {isSDKDataVisible && sdkResults && (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>SDK Processing Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div>
                  <Label>Extracted Data</Label>
                  <pre className="text-xs">{JSON.stringify(sdkResults.extractedData, null, 2)}</pre>
                </div>
                <div>
                  <Label>Metadata</Label>
                  <pre className="text-xs">{JSON.stringify(sdkResults.metadata, null, 2)}</pre>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Local Processing Section */}
      <div className="mb-4">
        <Label>Local Processing</Label>
        <Button onClick={handleLocalProcessing} disabled={isLocalProcessing}>
          {isLocalProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <span>Processing Locally... {getLocalProgressPercentage()}%</span>
            </>
          ) : (
            "Process Locally"
          )}
        </Button>
				{isLocalError && (
          <p className="text-red-500 mt-2">
            Local Error: {localErrorMessage}
          </p>
        )}
        {isLocalDataVisible && localResults && (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Local Processing Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div>
                  <Label>Extracted Data</Label>
                  <pre className="text-xs">{JSON.stringify(localResults.extractedData, null, 2)}</pre>
                </div>
                <div>
                  <Label>Metadata</Label>
                  <pre className="text-xs">{JSON.stringify(localResults.metadata, null, 2)}</pre>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default EnhancedCertificateGenerator;

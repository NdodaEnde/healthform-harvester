
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  FileText, Upload, Search, Clock, CheckCircle2, 
  X, ChevronLeft, FileCheck, Filter, Download, Copy
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import DocumentUploader from "@/components/DocumentUploader";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

// Mock documents data
const mockDocuments = [
  { 
    id: "doc-1", 
    name: "Medical Exam - John Doe.pdf", 
    type: "Medical Examination Questionnaire", 
    uploadedAt: "2023-05-15T10:30:00", 
    status: "processed",
    patientName: "John Doe",
    patientId: "P10045",
  },
  { 
    id: "doc-2", 
    name: "Certificate - Sarah Smith.pdf", 
    type: "Certificate of Fitness", 
    uploadedAt: "2023-05-14T14:45:00", 
    status: "processed",
    patientName: "Sarah Smith",
    patientId: "P10046",
  },
  { 
    id: "doc-3", 
    name: "Medical Exam - Robert Johnson.pdf", 
    type: "Medical Examination Questionnaire", 
    uploadedAt: "2023-05-12T09:15:00", 
    status: "processing",
    patientName: "Robert Johnson",
    patientId: "P10047",
  },
  { 
    id: "doc-4", 
    name: "Certificate - Emily Brown.pdf", 
    type: "Certificate of Fitness", 
    uploadedAt: "2023-05-10T16:20:00", 
    status: "processed",
    patientName: "Emily Brown",
    patientId: "P10048",
  },
  { 
    id: "doc-5", 
    name: "Medical Exam - Michael Wilson.pdf", 
    type: "Medical Examination Questionnaire", 
    uploadedAt: "2023-05-08T11:10:00", 
    status: "failed",
    patientName: "Michael Wilson",
    patientId: "P10049",
  }
];

const Dashboard = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState("all");
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  
  const filteredDocuments = mockDocuments.filter(doc => {
    if (selectedTab !== "all" && doc.status !== selectedTab) {
      return false;
    }
    
    if (searchQuery) {
      return (
        doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.patientId.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return true;
  });

  const handleViewDocument = (docId: string) => {
    navigate(`/document/${docId}`);
  };

  const handleDeleteDocument = (docId: string) => {
    toast.success("Document deleted successfully");
    // In a real application, you would delete the document from your database/storage
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center space-x-2" onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
            <FileText className="h-6 w-6" />
            <span className="font-medium text-lg">HealthForm Harvester</span>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon">
              <span className="sr-only">Settings</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
              >
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </Button>
            <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
              <span className="text-sm font-medium">AD</span>
            </div>
          </div>
        </div>
      </header>
      
      <main className="flex-1 container py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col space-y-8"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
              <p className="text-muted-foreground">Upload, process, and manage health documents</p>
            </div>
            <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Upload className="h-4 w-4" />
                  <span>Upload Document</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Upload Document</DialogTitle>
                </DialogHeader>
                <DocumentUploader onUploadComplete={() => {
                  setIsUploadDialogOpen(false);
                  toast.success("Document uploaded and processing started");
                }} />
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="grid gap-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search documents by name, patient, or ID..." 
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
                <span className="sr-only">Filter</span>
              </Button>
            </div>
            
            <Tabs defaultValue="all" onValueChange={setSelectedTab}>
              <div className="flex justify-between items-center">
                <TabsList>
                  <TabsTrigger value="all">All Documents</TabsTrigger>
                  <TabsTrigger value="processed">Processed</TabsTrigger>
                  <TabsTrigger value="processing">Processing</TabsTrigger>
                  <TabsTrigger value="failed">Failed</TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="all" className="mt-4">
                {filteredDocuments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <FileText className="h-12 w-12 text-muted-foreground mb-4" strokeWidth={1.5} />
                    <h3 className="text-xl font-medium mb-2">No documents found</h3>
                    <p className="text-muted-foreground max-w-sm">
                      {searchQuery ? "Try adjusting your search query" : "Upload your first document to get started"}
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    <AnimatePresence>
                      {filteredDocuments.map((doc) => (
                        <motion.div
                          key={doc.id}
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.3 }}
                        >
                          <Card className="group overflow-hidden">
                            <div className={`absolute inset-0 w-1 ${
                              doc.status === 'processed' ? 'bg-green-500' :
                              doc.status === 'processing' ? 'bg-blue-500' :
                              'bg-red-500'
                            }`} />
                            <CardHeader className="pb-4">
                              <div className="flex items-start justify-between">
                                <div className="flex items-center space-x-2">
                                  <FileText className="h-5 w-5 text-muted-foreground" />
                                  <div>
                                    <CardTitle className="text-lg">{doc.name}</CardTitle>
                                    <CardDescription>{doc.patientName} | {doc.patientId}</CardDescription>
                                  </div>
                                </div>
                                <Badge variant={
                                  doc.status === 'processed' ? 'default' :
                                  doc.status === 'processing' ? 'secondary' :
                                  'destructive'
                                }>
                                  {doc.status === 'processed' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                                  {doc.status === 'processing' && <Clock className="h-3 w-3 mr-1 animate-pulse" />}
                                  {doc.status === 'failed' && <X className="h-3 w-3 mr-1" />}
                                  {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent className="pb-2">
                              <div className="flex justify-between text-sm">
                                <div className="text-muted-foreground">
                                  Type: <span className="font-medium text-foreground">{doc.type}</span>
                                </div>
                                <div className="text-muted-foreground">
                                  Uploaded: <span className="font-medium text-foreground">
                                    {new Date(doc.uploadedAt).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            </CardContent>
                            <CardFooter className="pt-2 justify-end gap-2">
                              {doc.status === 'processed' && (
                                <>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => {
                                      toast.success("Document link copied to clipboard");
                                    }}
                                  >
                                    <Copy className="h-3.5 w-3.5 mr-1" />
                                    Copy Link
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => {
                                      toast.success("Document downloaded");
                                    }}
                                  >
                                    <Download className="h-3.5 w-3.5 mr-1" />
                                    Download
                                  </Button>
                                </>
                              )}
                              <Button 
                                size="sm"
                                onClick={() => handleViewDocument(doc.id)}
                                variant={doc.status === 'processed' ? 'default' : 'secondary'}
                                disabled={doc.status === 'processing'}
                              >
                                {doc.status === 'processed' ? 'View Data' : 'View Details'}
                              </Button>
                            </CardFooter>
                          </Card>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="processed" className="mt-4">
                {/* Same structure as 'all' tab but filtered for processed documents */}
                {/* This content is automatically filtered by the filteredDocuments logic */}
              </TabsContent>
              
              <TabsContent value="processing" className="mt-4">
                {/* Same structure as 'all' tab but filtered for processing documents */}
                {/* This content is automatically filtered by the filteredDocuments logic */}
              </TabsContent>
              
              <TabsContent value="failed" className="mt-4">
                {/* Same structure as 'all' tab but filtered for failed documents */}
                {/* This content is automatically filtered by the filteredDocuments logic */}
              </TabsContent>
            </Tabs>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Dashboard;

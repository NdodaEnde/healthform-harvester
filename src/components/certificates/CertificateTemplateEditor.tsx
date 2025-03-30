
import { useState, useEffect } from "react";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Card,
  CardContent
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { 
  LayoutTemplate, 
  Palette, 
  FileText, 
  Save, 
  ArrowRight 
} from "lucide-react";
import { useOrganization } from "@/contexts/OrganizationContext";

interface SectionConfig {
  title: string;
  enabled: boolean;
}

interface BrandingConfig {
  showLogo: boolean;
  showHeader: boolean;
  showFooter: boolean;
  useOrganizationColors: boolean;
  customColors?: {
    headerBackground?: string;
    headerText?: string;
    footerBackground?: string;
    footerText?: string;
    accentColor?: string;
  };
}

interface LayoutConfig {
  pageSize: "A4" | "Letter" | "Legal";
  orientation: "portrait" | "landscape";
  margins: {
    top: string;
    bottom: string;
    left: string;
    right: string;
  };
}

interface TemplateData {
  sections: SectionConfig[];
  branding: BrandingConfig;
  layout: LayoutConfig;
}

interface CertificateTemplateEditorProps {
  initialData: TemplateData;
  onSave: (data: TemplateData) => void;
}

export default function CertificateTemplateEditor({
  initialData,
  onSave,
}: CertificateTemplateEditorProps) {
  const { currentOrganization } = useOrganization();
  const [activeTab, setActiveTab] = useState("sections");
  const [templateData, setTemplateData] = useState<TemplateData>(initialData);

  // Update local state when initialData changes
  useEffect(() => {
    setTemplateData(initialData);
  }, [initialData]);

  const handleSectionToggle = (index: number, enabled: boolean) => {
    const updatedSections = [...templateData.sections];
    updatedSections[index] = {
      ...updatedSections[index],
      enabled,
    };
    
    setTemplateData({
      ...templateData,
      sections: updatedSections,
    });
  };

  const handleBrandingChange = (key: keyof BrandingConfig, value: boolean) => {
    setTemplateData({
      ...templateData,
      branding: {
        ...templateData.branding,
        [key]: value,
      },
    });
  };

  const handleCustomColorChange = (key: string, value: string) => {
    setTemplateData({
      ...templateData,
      branding: {
        ...templateData.branding,
        customColors: {
          ...(templateData.branding.customColors || {}),
          [key]: value,
        },
      },
    });
  };

  const handleLayoutChange = (key: keyof LayoutConfig, value: string) => {
    if (key === "pageSize" || key === "orientation") {
      setTemplateData({
        ...templateData,
        layout: {
          ...templateData.layout,
          [key]: value,
        },
      });
    }
  };

  const handleMarginChange = (side: string, value: string) => {
    setTemplateData({
      ...templateData,
      layout: {
        ...templateData.layout,
        margins: {
          ...templateData.layout.margins,
          [side]: value,
        },
      },
    });
  };

  const handleSaveTemplate = () => {
    try {
      onSave(templateData);
    } catch (error) {
      console.error("Error saving template:", error);
      toast({
        title: "Error",
        description: "Failed to save template. Please try again.",
        variant: "destructive",
      });
    }
  };

  const organizationBranding = currentOrganization?.settings?.branding;

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3">
          <TabsTrigger value="sections">
            <FileText className="mr-2 h-4 w-4" />
            Sections
          </TabsTrigger>
          <TabsTrigger value="branding">
            <Palette className="mr-2 h-4 w-4" />
            Branding
          </TabsTrigger>
          <TabsTrigger value="layout">
            <LayoutTemplate className="mr-2 h-4 w-4" />
            Layout
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sections" className="space-y-4 pt-4">
          <p className="text-sm text-muted-foreground mb-4">
            Choose which sections to include in the certificate
          </p>
          
          <div className="space-y-2">
            {templateData.sections.map((section, index) => (
              <div
                key={section.title}
                className="flex items-start space-x-3 space-y-0 rounded-md border p-3"
              >
                <Checkbox
                  checked={section.enabled}
                  onCheckedChange={(checked) => handleSectionToggle(index, !!checked)}
                  id={`section-${index}`}
                />
                <div className="space-y-1 leading-none">
                  <label
                    htmlFor={`section-${index}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {section.title}
                  </label>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="branding" className="space-y-4 pt-4">
          <p className="text-sm text-muted-foreground mb-4">
            Customize branding elements for the certificate
          </p>
          
          <div className="space-y-4">
            <div className="flex items-start space-x-3 space-y-0 rounded-md border p-3">
              <Checkbox
                checked={templateData.branding.showLogo}
                onCheckedChange={(checked) => handleBrandingChange("showLogo", !!checked)}
                id="show-logo"
              />
              <div className="space-y-1 leading-none">
                <label
                  htmlFor="show-logo"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Show organization logo
                </label>
                <p className="text-sm text-muted-foreground">
                  Include your organization logo in the certificate header
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 space-y-0 rounded-md border p-3">
              <Checkbox
                checked={templateData.branding.showHeader}
                onCheckedChange={(checked) => handleBrandingChange("showHeader", !!checked)}
                id="show-header"
              />
              <div className="space-y-1 leading-none">
                <label
                  htmlFor="show-header"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Show header with organization information
                </label>
                <p className="text-sm text-muted-foreground">
                  Include organization name and contact information at the top
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 space-y-0 rounded-md border p-3">
              <Checkbox
                checked={templateData.branding.showFooter}
                onCheckedChange={(checked) => handleBrandingChange("showFooter", !!checked)}
                id="show-footer"
              />
              <div className="space-y-1 leading-none">
                <label
                  htmlFor="show-footer"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Show footer
                </label>
                <p className="text-sm text-muted-foreground">
                  Include a footer with additional information
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 space-y-0 rounded-md border p-3">
              <Checkbox
                checked={templateData.branding.useOrganizationColors}
                onCheckedChange={(checked) => handleBrandingChange("useOrganizationColors", !!checked)}
                id="use-org-colors"
              />
              <div className="space-y-1 leading-none">
                <label
                  htmlFor="use-org-colors"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Use organization branding colors
                </label>
                <p className="text-sm text-muted-foreground">
                  Apply your organization's color scheme to the certificate
                </p>
                
                {organizationBranding && (
                  <div className="flex mt-2 space-x-2">
                    <div 
                      className="h-5 w-5 rounded border" 
                      style={{ backgroundColor: organizationBranding.primary_color }} 
                      title="Primary color"
                    />
                    <div 
                      className="h-5 w-5 rounded border" 
                      style={{ backgroundColor: organizationBranding.secondary_color }} 
                      title="Secondary color"
                    />
                    <div 
                      className="h-5 w-5 rounded border" 
                      style={{ backgroundColor: organizationBranding.text_color }} 
                      title="Text color"
                    />
                  </div>
                )}
              </div>
            </div>

            {!templateData.branding.useOrganizationColors && (
              <Accordion type="single" collapsible className="mt-2">
                <AccordionItem value="custom-colors">
                  <AccordionTrigger>Custom colors</AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="header-bg">Header background</Label>
                        <div className="flex space-x-2">
                          <Input
                            id="header-bg"
                            value={templateData.branding.customColors?.headerBackground || "#ffffff"}
                            onChange={(e) => handleCustomColorChange("headerBackground", e.target.value)}
                          />
                          <input
                            type="color"
                            value={templateData.branding.customColors?.headerBackground || "#ffffff"}
                            onChange={(e) => handleCustomColorChange("headerBackground", e.target.value)}
                            className="w-10 h-10 p-1 rounded"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="header-text">Header text</Label>
                        <div className="flex space-x-2">
                          <Input
                            id="header-text"
                            value={templateData.branding.customColors?.headerText || "#000000"}
                            onChange={(e) => handleCustomColorChange("headerText", e.target.value)}
                          />
                          <input
                            type="color"
                            value={templateData.branding.customColors?.headerText || "#000000"}
                            onChange={(e) => handleCustomColorChange("headerText", e.target.value)}
                            className="w-10 h-10 p-1 rounded"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="footer-bg">Footer background</Label>
                        <div className="flex space-x-2">
                          <Input
                            id="footer-bg"
                            value={templateData.branding.customColors?.footerBackground || "#ffffff"}
                            onChange={(e) => handleCustomColorChange("footerBackground", e.target.value)}
                          />
                          <input
                            type="color"
                            value={templateData.branding.customColors?.footerBackground || "#ffffff"}
                            onChange={(e) => handleCustomColorChange("footerBackground", e.target.value)}
                            className="w-10 h-10 p-1 rounded"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="footer-text">Footer text</Label>
                        <div className="flex space-x-2">
                          <Input
                            id="footer-text"
                            value={templateData.branding.customColors?.footerText || "#000000"}
                            onChange={(e) => handleCustomColorChange("footerText", e.target.value)}
                          />
                          <input
                            type="color"
                            value={templateData.branding.customColors?.footerText || "#000000"}
                            onChange={(e) => handleCustomColorChange("footerText", e.target.value)}
                            className="w-10 h-10 p-1 rounded"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="accent-color">Accent color</Label>
                        <div className="flex space-x-2">
                          <Input
                            id="accent-color"
                            value={templateData.branding.customColors?.accentColor || "#6366f1"}
                            onChange={(e) => handleCustomColorChange("accentColor", e.target.value)}
                          />
                          <input
                            type="color"
                            value={templateData.branding.customColors?.accentColor || "#6366f1"}
                            onChange={(e) => handleCustomColorChange("accentColor", e.target.value)}
                            className="w-10 h-10 p-1 rounded"
                          />
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}
          </div>
        </TabsContent>

        <TabsContent value="layout" className="space-y-4 pt-4">
          <p className="text-sm text-muted-foreground mb-4">
            Configure the certificate layout and dimensions
          </p>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="page-size">Page size</Label>
              <Select
                value={templateData.layout.pageSize}
                onValueChange={(value) => handleLayoutChange("pageSize", value)}
              >
                <SelectTrigger id="page-size">
                  <SelectValue placeholder="Select page size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A4">A4</SelectItem>
                  <SelectItem value="Letter">Letter</SelectItem>
                  <SelectItem value="Legal">Legal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="orientation">Orientation</Label>
              <Select
                value={templateData.layout.orientation}
                onValueChange={(value) => handleLayoutChange("orientation", value)}
              >
                <SelectTrigger id="orientation">
                  <SelectValue placeholder="Select orientation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="portrait">Portrait</SelectItem>
                  <SelectItem value="landscape">Landscape</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2 mt-4">
            <Label>Margins</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="margin-top" className="text-xs text-muted-foreground">Top</Label>
                <Input
                  id="margin-top"
                  value={templateData.layout.margins.top}
                  onChange={(e) => handleMarginChange("top", e.target.value)}
                  placeholder="2.5cm"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="margin-bottom" className="text-xs text-muted-foreground">Bottom</Label>
                <Input
                  id="margin-bottom"
                  value={templateData.layout.margins.bottom}
                  onChange={(e) => handleMarginChange("bottom", e.target.value)}
                  placeholder="2.5cm"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="margin-left" className="text-xs text-muted-foreground">Left</Label>
                <Input
                  id="margin-left"
                  value={templateData.layout.margins.left}
                  onChange={(e) => handleMarginChange("left", e.target.value)}
                  placeholder="2.5cm"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="margin-right" className="text-xs text-muted-foreground">Right</Label>
                <Input
                  id="margin-right"
                  value={templateData.layout.margins.right}
                  onChange={(e) => handleMarginChange("right", e.target.value)}
                  placeholder="2.5cm"
                />
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-between items-center mt-6">
        <Button variant="outline" onClick={() => setActiveTab(activeTab === "sections" ? "branding" : activeTab === "branding" ? "layout" : "sections")}>
          {activeTab === "layout" ? (
            <>
              <ArrowRight className="mr-2 h-4 w-4 rotate-180" />
              Previous
            </>
          ) : (
            <>
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
        
        <Button onClick={handleSaveTemplate}>
          <Save className="mr-2 h-4 w-4" />
          Save Template
        </Button>
      </div>
    </div>
  );
}


import React, { useState } from 'react';
import { motion } from 'framer-motion';
import PatientList from '@/components/PatientList';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { InfoIcon, CalendarIcon, Users2Icon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { extractInfoFromSAID } from "@/utils/sa-id-utils";

const PatientsPage = () => {
  const { currentOrganization, currentClient } = useOrganization();
  const contextLabel = currentClient ? currentClient.name : currentOrganization?.name;
  const [idNumber, setIdNumber] = useState('');
  const [idAnalysis, setIdAnalysis] = useState<null | {
    dateOfBirth: Date | null;
    gender: 'male' | 'female' | null;
    citizenship: 'citizen' | 'permanent_resident' | null;
    isValid: boolean;
    age?: number;
  }>(null);

  const analyzeID = () => {
    if (!idNumber || idNumber.length !== 13) {
      toast({
        title: "Invalid ID Number",
        description: "Please enter a valid 13-digit South African ID number.",
        variant: "destructive"
      });
      return;
    }

    const info = extractInfoFromSAID(idNumber);
    
    // Calculate age if date of birth is available
    if (info.dateOfBirth) {
      const today = new Date();
      let age = today.getFullYear() - info.dateOfBirth.getFullYear();
      const monthDiff = today.getMonth() - info.dateOfBirth.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < info.dateOfBirth.getDate())) {
        age--;
      }
      
      info.age = age;
    }
    
    setIdAnalysis(info);
  };

  return (
    <div className="mt-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Patients</h1>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">
                <InfoIcon className="mr-2 h-4 w-4" />
                Analyze SA ID
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>South African ID Analyzer</DialogTitle>
                <DialogDescription>
                  Enter a South African ID number to extract demographic information.
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="id-number">ID Number</Label>
                  <Input 
                    id="id-number"
                    placeholder="13-digit SA ID number" 
                    value={idNumber}
                    onChange={(e) => setIdNumber(e.target.value.replace(/[^0-9]/g, ''))}
                    maxLength={13}
                  />
                </div>
              </div>

              {idAnalysis && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      Analysis Result
                      <Badge className="ml-2" variant={idAnalysis.isValid ? "default" : "destructive"}>
                        {idAnalysis.isValid ? "Valid" : "Invalid"}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center">
                      <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                      {idAnalysis.dateOfBirth ? (
                        <span>
                          Born: {idAnalysis.dateOfBirth.toLocaleDateString()} 
                          {idAnalysis.age !== undefined && ` (${idAnalysis.age} years)`}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Birth date could not be determined</span>
                      )}
                    </div>
                    
                    <div className="flex items-center">
                      <Users2Icon className="mr-2 h-4 w-4 text-muted-foreground" />
                      {idAnalysis.gender ? (
                        <span className="capitalize">{idAnalysis.gender}</span>
                      ) : (
                        <span className="text-muted-foreground">Gender could not be determined</span>
                      )}
                    </div>
                    
                    <div>
                      <Badge variant="outline" className="capitalize">
                        {idAnalysis.citizenship === 'citizen' ? 'SA Citizen' : 
                         idAnalysis.citizenship === 'permanent_resident' ? 'Permanent Resident' : 
                         'Citizenship unknown'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              <DialogFooter>
                <Button onClick={analyzeID} type="button">Analyze</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Patient List Component - the main focus of the page */}
        <PatientList />
      </motion.div>
    </div>
  );
};

export default PatientsPage;

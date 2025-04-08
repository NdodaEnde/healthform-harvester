import React, { useState, useEffect } from 'react';
import { parseSouthAfricanIDNumber, getIDNumberSummary } from '../utils/sa-id-parser';
import { Badge } from './ui/badge';
import { InfoCircledIcon, CheckCircledIcon, CrossCircledIcon } from '@radix-ui/react-icons';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

interface PatientSAIDInfoProps {
  idNumber: string | null | undefined;
  className?: string;
  showDetailed?: boolean;
}

const PatientSAIDInfo: React.FC<PatientSAIDInfoProps> = ({ 
  idNumber, 
  className,
  showDetailed = false
}) => {
  const [idData, setIdData] = useState(() => 
    idNumber ? parseSouthAfricanIDNumber(idNumber) : { isValid: false }
  );

  useEffect(() => {
    if (idNumber) {
      setIdData(parseSouthAfricanIDNumber(idNumber));
    } else {
      setIdData({ isValid: false });
    }
  }, [idNumber]);

  if (!idNumber) {
    return (
      <div className={cn("flex items-center text-sm text-muted-foreground", className)}>
        <InfoCircledIcon className="mr-1 h-4 w-4" />
        <span>No ID number provided</span>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Simple view */}
      {!showDetailed && (
        <div className="flex items-center">
          {idData.isValid ? (
            <>
              <Badge variant="outline" className="font-mono mr-2 border-green-200 bg-green-50">
                {idData.formattedIDNumber}
              </Badge>
              <CheckCircledIcon className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-sm text-muted-foreground">{getIDNumberSummary(idData)}</span>
            </>
          ) : (
            <>
              <Badge variant="outline" className="font-mono mr-2 border-red-200 bg-red-50">
                {idNumber}
              </Badge>
              <CrossCircledIcon className="h-4 w-4 text-red-500 mr-1" />
              <span className="text-sm text-muted-foreground">Invalid ID number</span>
            </>
          )}
        </div>
      )}

      {/* Detailed view */}
      {showDetailed && (
        <div className="space-y-2">
          <div className="flex items-center">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center">
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "font-mono text-sm mr-2",
                        idData.isValid 
                          ? "border-green-200 bg-green-50" 
                          : "border-red-200 bg-red-50"
                      )}
                    >
                      {idData.isValid ? idData.formattedIDNumber : idNumber}
                    </Badge>
                    {idData.isValid 
                      ? <CheckCircledIcon className="h-4 w-4 text-green-500" /> 
                      : <CrossCircledIcon className="h-4 w-4 text-red-500" />}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{idData.isValid ? 'Valid South African ID' : 'Invalid South African ID'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {idData.isValid && (
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Date of Birth</div>
                <div>
                  {idData.birthDate?.toLocaleDateString('en-ZA', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  })}
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Gender</div>
                <div className="capitalize">{idData.gender}</div>
              </div>
              
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Status</div>
                <div className="capitalize">
                  {idData.citizenshipStatus === 'citizen' ? 'Citizen' : 'Permanent Resident'}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PatientSAIDInfo;
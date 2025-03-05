import React from "react";
import { 
  TooltipProvider,
  Tooltip,
  TooltipContent,
  TooltipTrigger 
} from "@/components/ui/tooltip";

// Confidence indicator component
const ConfidenceIndicator = ({ score }: { score: number }) => {
  const getColorClass = () => {
    if (score >= 0.7) return "bg-green-500";
    if (score >= 0.4) return "bg-yellow-500";
    return "bg-red-500";
  };
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <div className={`w-2 h-2 rounded-full ml-1 ${getColorClass()}`}></div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Confidence: {Math.round(score * 100)}%</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// CheckboxField component with allowUncheck parameter
const CheckboxField = ({ 
  checked, 
  onChange, 
  fieldName, 
  confidence = 0.9,
  allowUncheck = true
}: { 
  checked: boolean; 
  onChange: (field: string, value: boolean) => void; 
  fieldName: string; 
  confidence?: number;
  allowUncheck?: boolean;
}) => {
  const handleChange = () => {
    // If already checked and allowUncheck is true, uncheck it
    // Otherwise, check it
    onChange(fieldName, allowUncheck ? !checked : true);
  };

  return (
    <div className="flex items-center justify-center h-8">
      <input 
        type="checkbox" 
        checked={checked} 
        onChange={handleChange}
        className="w-5 h-5"
      />
      <ConfidenceIndicator score={confidence} />
    </div>
  );
};

interface FitnessDeclarationProps {
  formData: any;
  handleCheckboxChange: (field: string, value: boolean) => void;
  confidenceScores: any;
}

const FitnessDeclaration = ({ formData, handleCheckboxChange, confidenceScores }: FitnessDeclarationProps) => {
  return (
    <div className="mb-6">
      <div className="bg-gray-800 text-white text-center py-1 text-sm font-semibold mb-2">
        Medical Fitness Declaration
      </div>
      
      <div className="px-4">
        <table className="w-full border border-gray-400">
          <tbody>
            <tr>
              <td className={`border border-gray-400 p-3 text-center ${formData.certification.fit ? 'bg-green-100' : ''}`}>
                <div className="font-semibold text-sm">FIT</div>
                <CheckboxField 
                  checked={formData.certification.fit} 
                  onChange={handleCheckboxChange} 
                  fieldName="certification.fit"
                  confidence={confidenceScores.certification.fit}
                  allowUncheck={true}
                />
              </td>
              <td className={`border border-gray-400 p-3 text-center ${formData.certification.fit_with_restrictions ? 'bg-yellow-100' : ''}`}>
                <div className="font-semibold text-sm">Fit with Restriction</div>
                <CheckboxField 
                  checked={formData.certification.fit_with_restrictions} 
                  onChange={handleCheckboxChange} 
                  fieldName="certification.fit_with_restrictions"
                  confidence={confidenceScores.certification.fit_with_restrictions}
                  allowUncheck={true}
                />
              </td>
              <td className={`border border-gray-400 p-3 text-center ${formData.certification.fit_with_condition ? 'bg-yellow-100' : ''}`}>
                <div className="font-semibold text-sm">Fit with Condition</div>
                <CheckboxField 
                  checked={formData.certification.fit_with_condition} 
                  onChange={handleCheckboxChange} 
                  fieldName="certification.fit_with_condition"
                  confidence={confidenceScores.certification.fit_with_condition}
                  allowUncheck={true}
                />
              </td>
              <td className={`border border-gray-400 p-3 text-center ${formData.certification.temporarily_unfit ? 'bg-red-100' : ''}`}>
                <div className="font-semibold text-sm">Temporary Unfit</div>
                <CheckboxField 
                  checked={formData.certification.temporarily_unfit} 
                  onChange={handleCheckboxChange} 
                  fieldName="certification.temporarily_unfit"
                  confidence={confidenceScores.certification.temporarily_unfit}
                  allowUncheck={true}
                />
              </td>
              <td className={`border border-gray-400 p-3 text-center ${formData.certification.unfit ? 'bg-red-100' : ''}`}>
                <div className="font-semibold text-sm">UNFIT</div>
                <CheckboxField 
                  checked={formData.certification.unfit} 
                  onChange={handleCheckboxChange} 
                  fieldName="certification.unfit"
                  confidence={confidenceScores.certification.unfit}
                  allowUncheck={true}
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FitnessDeclaration;
export { CheckboxField, ConfidenceIndicator };

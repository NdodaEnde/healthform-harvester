// Mock data for development and testing
export const mockDocumentData = {
  id: "28885993-23aa-4c2a-883b-5405468ded44",
  created_at: "2025-03-29T14:30:00Z",
  updated_at: "2025-03-29T14:45:00Z",
  patientName: "John Smith",
  type: "Certificate of Fitness",
  imageUrl: "https://via.placeholder.com/500x700",
  status: "processed",
  extracted_data: {
    personal: {
      fullName: "John Smith",
      dateOfBirth: "1985-06-15",
      gender: "Male",
      employeeId: "EMP123456",
      address: "123 Main Street, Anytown, AN 12345",
      phoneNumber: "+27 11 123 4567",
      email: "john.smith@example.com",
      occupation: "Engineer",
      employer: "Mining Corp Ltd"
    },
    medical: {
      allergies: "None",
      currentMedications: "Lisinopril 10mg daily",
      chronicConditions: "Hypertension",
      previousSurgeries: "Appendectomy (2010)",
      familyHistory: "Father - diabetes, Mother - hypertension",
      smoker: "No",
      alcoholConsumption: "Occasional",
      exerciseFrequency: "2-3 times per week"
    },
    vitals: {
      height: "178 cm",
      weight: "85 kg",
      bmi: "26.8",
      bloodPressure: "130/85",
      heartRate: "72 bpm",
      respiratoryRate: "16 breaths/min",
      temperature: "36.8°C",
      oxygenSaturation: "98%"
    },
    examResults: {
      vision: "20/20 both eyes",
      hearing: "Normal range bilateral",
      lungFunction: "FVC 5.2L, FEV1 4.1L (normal)",
      chestXRay: "No abnormalities detected",
      laboratory: "Full blood count - normal\nLiver function - normal\nKidney function - normal\nCholesterol - slightly elevated (5.2 mmol/L)"
    },
    assessment: {
      diagnosis: "Essential hypertension (controlled)",
      recommendations: "Continue current medications\nSchedule follow-up in 6 months\nReduce salt intake\nIncrease physical activity",
      restrictions: "No high-altitude work",
      fitnessConclusion: "Fit with restrictions"
    },
    structured_data: {
      patient: {
        name: "John Smith",
        id_number: "8506151234088",
        company: "Mining Corp Ltd",
        occupation: "Engineer"
      },
      examination_results: {
        date: "2025-03-29",
        type: {
          periodical: true,
          pre_employment: false,
          exit: false
        },
        test_results: {
          bloods_done: true,
          bloods_results: "Normal",
          far_near_vision_done: true,
          far_near_vision_results: "20/20",
          side_depth_done: true,
          side_depth_results: "Normal",
          night_vision_done: false,
          hearing_done: true,
          hearing_results: "Normal range bilateral",
          heights_done: true,
          heights_results: "Passed",
          lung_function_done: true,
          lung_function_results: "FVC 5.2L, FEV1 4.1L",
          x_ray_done: true,
          x_ray_results: "Normal",
          drug_screen_done: false
        }
      },
      certification: {
        valid_until: "2025-09-29",
        fit: false,
        fit_with_restrictions: true,
        fit_with_condition: false,
        temporarily_unfit: false,
        unfit: false,
        follow_up: "Schedule review in 6 months",
        review_date: "2025-09-29",
        comments: "Patient is fit for duty with restriction to avoid high-altitude work."
      },
      restrictions: {
        heights: true,
        dust_exposure: false,
        motorized_equipment: false,
        wear_hearing_protection: false,
        confined_spaces: false,
        chemical_exposure: false,
        wear_spectacles: false,
        remain_on_treatment_for_chronic_conditions: true
      }
    }
  },
  extractedData: {
    personal: {
      fullName: "John Smith",
      dateOfBirth: "1985-06-15",
      gender: "Male",
      employeeId: "EMP123456",
      address: "123 Main Street, Anytown, AN 12345",
      phoneNumber: "+27 11 123 4567",
      email: "john.smith@example.com",
      occupation: "Engineer",
      employer: "Mining Corp Ltd"
    },
    medical: {
      allergies: "None",
      currentMedications: "Lisinopril 10mg daily",
      chronicConditions: "Hypertension",
      previousSurgeries: "Appendectomy (2010)",
      familyHistory: "Father - diabetes, Mother - hypertension",
      smoker: "No",
      alcoholConsumption: "Occasional",
      exerciseFrequency: "2-3 times per week"
    },
    vitals: {
      height: "178 cm",
      weight: "85 kg",
      bmi: "26.8",
      bloodPressure: "130/85",
      heartRate: "72 bpm",
      respiratoryRate: "16 breaths/min",
      temperature: "36.8°C",
      oxygenSaturation: "98%"
    },
    examResults: {
      vision: "20/20 both eyes",
      hearing: "Normal range bilateral",
      lungFunction: "FVC 5.2L, FEV1 4.1L (normal)",
      chestXRay: "No abnormalities detected",
      laboratory: "Full blood count - normal\nLiver function - normal\nKidney function - normal\nCholesterol - slightly elevated (5.2 mmol/L)"
    },
    assessment: {
      diagnosis: "Essential hypertension (controlled)",
      recommendations: "Continue current medications\nSchedule follow-up in 6 months\nReduce salt intake\nIncrease physical activity",
      restrictions: "No high-altitude work",
      fitnessConclusion: "Fit with restrictions"
    },
    structured_data: {
      patient: {
        name: "John Smith",
        id_number: "8506151234088",
        company: "Mining Corp Ltd",
        occupation: "Engineer"
      },
      examination_results: {
        date: "2025-03-29",
        type: {
          periodical: true,
          pre_employment: false,
          exit: false
        },
        test_results: {
          bloods_done: true,
          bloods_results: "Normal",
          far_near_vision_done: true,
          far_near_vision_results: "20/20",
          side_depth_done: true,
          side_depth_results: "Normal",
          night_vision_done: false,
          hearing_done: true,
          hearing_results: "Normal range bilateral",
          heights_done: true,
          heights_results: "Passed",
          lung_function_done: true,
          lung_function_results: "FVC 5.2L, FEV1 4.1L",
          x_ray_done: true,
          x_ray_results: "Normal",
          drug_screen_done: false
        }
      },
      certification: {
        valid_until: "2025-09-29",
        fit: false,
        fit_with_restrictions: true,
        fit_with_condition: false,
        temporarily_unfit: false,
        unfit: false,
        follow_up: "Schedule review in 6 months",
        review_date: "2025-09-29",
        comments: "Patient is fit for duty with restriction to avoid high-altitude work."
      },
      restrictions: {
        heights: true,
        dust_exposure: false,
        motorized_equipment: false,
        wear_hearing_protection: false,
        confined_spaces: false,
        chemical_exposure: false,
        wear_spectacles: false,
        remain_on_treatment_for_chronic_conditions: true
      }
    }
  },
  jsonData: {
    personal: {
      fullName: "John Smith",
      dateOfBirth: "1985-06-15",
      gender: "Male",
      employeeId: "EMP123456"
    },
    medicalAssessment: {
      date: "2025-03-29",
      assessor: "Dr. Jane Doe",
      conclusion: "Fit with restrictions",
      restrictions: ["No high-altitude work"]
    }
  }
};

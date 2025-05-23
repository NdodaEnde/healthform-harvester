
// Add this helper function to properly extract and flatten the data structure
const extractFieldValue = (data: any, fieldPath: string[]): any => {
  let current = data;
  for (const key of fieldPath) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      return '';
    }
  }
  return current || '';
};

// Add this helper function to safely set nested values
const setNestedValue = (obj: any, path: string[], value: any) => {
  let current = obj;
  for (let i = 0; i < path.length - 1; i++) {
    if (!current[path[i]] || typeof current[path[i]] !== 'object') {
      current[path[i]] = {};
    }
    current = current[path[i]];
  }
  current[path[path.length - 1]] = value;
};

// Replace your toggleEditMode function with this improved version
const toggleEditMode = () => {
  if (!isEditing) {
    // Entering edit mode - properly initialize editableData with current values
    const originalData = JSON.parse(JSON.stringify(document.extractedData));
    setOriginalData(originalData);
    
    // Create a properly structured editable data object
    const editableData = JSON.parse(JSON.stringify(originalData));
    
    // Ensure the structure exists for certificate data
    if (document.type === 'Certificate of Fitness') {
      if (!editableData.structured_data) {
        editableData.structured_data = {};
      }
      if (!editableData.structured_data.patient) {
        editableData.structured_data.patient = {};
      }
      if (!editableData.structured_data.examination_results) {
        editableData.structured_data.examination_results = {
          type: {},
          test_results: {}
        };
      }
      if (!editableData.structured_data.certification) {
        editableData.structured_data.certification = {};
      }
      if (!editableData.structured_data.restrictions) {
        editableData.structured_data.restrictions = {};
      }
      
      // Pre-populate fields that might be missing but have display values
      const patient = editableData.structured_data.patient;
      if (!patient.name && document.patientName && document.patientName !== "Unknown") {
        patient.name = document.patientName;
      }
      if (!patient.id_number && document.patientId && document.patientId !== "No ID") {
        patient.id_number = document.patientId;
      }
    }
    
    console.log('Initializing edit mode with data:', editableData);
    setEditableData(editableData);
  } else {
    // Exiting edit mode
    setEditableData(null);
    setOriginalData(null);
  }
  setIsEditing(!isEditing);
};

// Replace your updateEditableData function with this improved version
const updateEditableData = (path: string[], value: any) => {
  setEditableData((prev: any) => {
    if (!prev) return prev;
    
    const newData = JSON.parse(JSON.stringify(prev));
    setNestedValue(newData, path, value);
    
    console.log(`Updated ${path.join('.')} to:`, value);
    console.log('Full updated data:', newData);
    
    return newData;
  });
};

// Replace your renderCertificateSection function with this improved version
const renderCertificateSection = (data: any) => {
  if (!data) return null;
  
  console.log('Rendering certificate section with data:', data);
  
  const renderPatientSection = () => {
    // Try multiple paths to find patient data
    const patient = data.structured_data?.patient || 
                   data.patient || 
                   {};
    
    console.log('Patient data:', patient);
    
    return (
      <div className="space-y-4 mb-4">
        <h3 className="text-lg font-medium">Patient Information</h3>
        <div className="flex justify-between space-x-4">
          <div className="flex-1">
            <div className="flex items-center">
              <span className="font-semibold mr-1">Initials & Surname:</span>
              <Input 
                className="border-b border-gray-400 flex-1 bg-transparent p-0 h-6 focus-visible:ring-0 rounded-none shadow-none" 
                value={patient.name || patient.full_name || document.patientName || ''}
                onChange={(e) => updateEditableData(['structured_data', 'patient', 'name'], e.target.value)}
                placeholder="Enter patient name"
              />
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center">
              <span className="font-semibold mr-1">ID NO:</span>
              <Input 
                className="border-b border-gray-400 flex-1 bg-transparent p-0 h-6 focus-visible:ring-0 rounded-none shadow-none" 
                value={patient.id_number || patient.employee_id || patient.id || document.patientId || ''}
                onChange={(e) => updateEditableData(['structured_data', 'patient', 'id_number'], e.target.value)}
                placeholder="Enter ID number"
              />
            </div>
          </div>
        </div>
        
        <div className="flex items-center">
          <span className="font-semibold mr-1">Company Name:</span>
          <Input 
            className="border-b border-gray-400 flex-1 bg-transparent p-0 h-6 focus-visible:ring-0 rounded-none shadow-none" 
            value={patient.company || patient.employer || ''}
            onChange={(e) => updateEditableData(['structured_data', 'patient', 'company'], e.target.value)}
            placeholder="Enter company name"
          />
        </div>
        
        <div className="flex justify-between space-x-4">
          <div className="flex-1">
            <div className="flex items-center">
              <span className="font-semibold mr-1">Date of Examination:</span>
              <Input 
                type="date"
                className="border-b border-gray-400 flex-1 bg-transparent p-0 h-6 focus-visible:ring-0 rounded-none shadow-none" 
                value={data.structured_data?.examination_results?.date || 
                       data.examination?.date || 
                       data.date || ''}
                onChange={(e) => updateEditableData(['structured_data', 'examination_results', 'date'], e.target.value)}
              />
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center">
              <span className="font-semibold mr-1">Expiry Date:</span>
              <Input 
                type="date"
                className="border-b border-gray-400 flex-1 bg-transparent p-0 h-6 focus-visible:ring-0 rounded-none shadow-none" 
                value={data.structured_data?.certification?.valid_until || 
                       data.certification?.expiry_date || 
                       data.expiry_date || ''}
                onChange={(e) => updateEditableData(['structured_data', 'certification', 'valid_until'], e.target.value)}
              />
            </div>
          </div>
        </div>
        
        <div className="flex items-center">
          <span className="font-semibold mr-1">Job Title:</span>
          <Input 
            className="border-b border-gray-400 flex-1 bg-transparent p-0 h-6 focus-visible:ring-0 rounded-none shadow-none" 
            value={patient.occupation || patient.job_title || ''}
            onChange={(e) => updateEditableData(['structured_data', 'patient', 'occupation'], e.target.value)}
            placeholder="Enter job title"
          />
        </div>
      </div>
    );
  };
  
  const renderExaminationTypeSection = () => {
    const examinationType = data.structured_data?.examination_results?.type || 
                           data.examination_results?.type || 
                           data.examination_type || 
                           {};
    
    console.log('Examination type data:', examinationType);
    
    return (
      <div className="mb-4">
        <h3 className="text-lg font-medium mb-2">Examination Type</h3>
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
                <Checkbox 
                  checked={!!(examinationType.pre_employment || examinationType === 'PRE-EMPLOYMENT')} 
                  onCheckedChange={(checked) => updateEditableData(['structured_data', 'examination_results', 'type', 'pre_employment'], !!checked)}
                  className="mx-auto"
                />
              </td>
              <td className="border border-gray-400 h-8 text-center">
                <Checkbox 
                  checked={!!(examinationType.periodical || examinationType === 'PERIODICAL')} 
                  onCheckedChange={(checked) => updateEditableData(['structured_data', 'examination_results', 'type', 'periodical'], !!checked)}
                  className="mx-auto"
                />
              </td>
              <td className="border border-gray-400 h-8 text-center">
                <Checkbox 
                  checked={!!(examinationType.exit || examinationType === 'EXIT')} 
                  onCheckedChange={(checked) => updateEditableData(['structured_data', 'examination_results', 'type', 'exit'], !!checked)}
                  className="mx-auto"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  const renderTestResultsSection = () => {
    const testResults = data.structured_data?.examination_results?.test_results || 
                       data.examination_results?.test_results || 
                       data.test_results || 
                       {};
    
    console.log('Test results data:', testResults);
    
    const renderTestRow = (label: string, doneKey: string, resultsKey: string) => (
      <tr key={label}>
        <td className="border border-gray-400 pl-2 text-sm">{label}</td>
        <td className="border border-gray-400 text-center">
          <Checkbox 
            checked={!!(testResults[doneKey] || testResults[`${label.toLowerCase().replace(/[,\s]/g, '_')}_done`])} 
            onCheckedChange={(checked) => updateEditableData(['structured_data', 'examination_results', 'test_results', doneKey], !!checked)}
            className="mx-auto"
          />
        </td>
        <td className="border border-gray-400 p-1 text-sm">
          <Input 
            className="w-full border-0 p-0 h-6 bg-transparent shadow-none focus-visible:ring-0" 
            value={testResults[resultsKey] || testResults[`${label.toLowerCase().replace(/[,\s]/g, '_')}_result`] || ''}
            onChange={(e) => updateEditableData(['structured_data', 'examination_results', 'test_results', resultsKey], e.target.value)}
            placeholder="Enter result"
          />
        </td>
      </tr>
    );
    
    return (
      <div className="mb-4">
        <h3 className="text-lg font-medium mb-2">Medical Tests</h3>
        <div className="grid grid-cols-2 gap-6">
          {/* Left Column */}
          <div>
            <table className="w-full border border-gray-400">
              <thead>
                <tr>
                  <th className="border border-gray-400 py-1 w-1/3 text-left pl-2 bg-blue-50 text-sm">Tests</th>
                  <th className="border border-gray-400 py-1 w-1/6 text-center bg-blue-50 text-xs">Done</th>
                  <th className="border border-gray-400 py-1 text-center bg-blue-50 text-xs">Results</th>
                </tr>
              </thead>
              <tbody>
                {renderTestRow("BLOODS", "bloods_done", "bloods_results")}
                {renderTestRow("FAR, NEAR VISION", "far_near_vision_done", "far_near_vision_results")}
                {renderTestRow("SIDE & DEPTH", "side_depth_done", "side_depth_results")}
                {renderTestRow("NIGHT VISION", "night_vision_done", "night_vision_results")}
              </tbody>
            </table>
          </div>

          {/* Right Column */}
          <div>
            <table className="w-full border border-gray-400">
              <thead>
                <tr>
                  <th className="border border-gray-400 py-1 text-left pl-2 bg-blue-50 text-sm">Tests</th>
                  <th className="border border-gray-400 py-1 w-1/6 text-center bg-blue-50 text-xs">Done</th>
                  <th className="border border-gray-400 py-1 text-center bg-blue-50 text-xs">Results</th>
                </tr>
              </thead>
              <tbody>
                {renderTestRow("Hearing", "hearing_done", "hearing_results")}
                {renderTestRow("Working at Heights", "heights_done", "heights_results")}
                {renderTestRow("Lung Function", "lung_function_done", "lung_function_results")}
                {renderTestRow("X-Ray", "x_ray_done", "x_ray_results")}
                {renderTestRow("Drug Screen", "drug_screen_done", "drug_screen_results")}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };
  
  // Continue with other sections...
  const renderFollowUpSection = () => {
    const certification = data.structured_data?.certification || 
                         data.certification || 
                         {};
    
    return (
      <div className="mb-4">
        <div className="flex items-center">
          <div className="font-semibold text-sm mr-1">Referred or follow up actions:</div>
          <div className="border-b border-gray-400 flex-1">
            <Input 
              className="border-0 p-0 h-6 w-full bg-transparent shadow-none focus-visible:ring-0" 
              value={certification.follow_up || certification.follow_up_actions || ''}
              onChange={(e) => updateEditableData(['structured_data', 'certification', 'follow_up'], e.target.value)}
              placeholder="Enter follow-up actions"
            />
          </div>
          <div className="ml-2">
            <div className="text-sm">
              <span className="font-semibold mr-1">Review Date:</span>
              <Input 
                type="date"
                className="border-0 border-b border-gray-400 p-0 h-6 w-24 bg-transparent shadow-none focus-visible:ring-0 text-red-600" 
                value={certification.review_date || ''}
                onChange={(e) => updateEditableData(['structured_data', 'certification', 'review_date'], e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderRestrictionsSection = () => {
    const restrictions = data.structured_data?.restrictions || 
                        data.restrictions || 
                        {};
    
    const renderRestrictionCell = (label: string, key: string) => (
      <td key={key} className={`border border-gray-400 p-2 text-center`}>
        <div className="font-semibold">{label}</div>
        <div className="flex justify-center mt-1">
          <Checkbox 
            checked={!!(restrictions[key] || restrictions[label.toLowerCase().replace(/\s/g, '_')])} 
            onCheckedChange={(checked) => updateEditableData(['structured_data', 'restrictions', key], !!checked)}
          />
        </div>
      </td>
    );
    
    return (
      <div className="mb-4">
        <h3 className="text-lg font-medium mb-2">Restrictions</h3>
        <table className="w-full border border-gray-400 text-sm">
          <tbody>
            <tr>
              {renderRestrictionCell("Heights", "heights")}
              {renderRestrictionCell("Dust Exposure", "dust_exposure")}
              {renderRestrictionCell("Motorized Equipment", "motorized_equipment")}
              {renderRestrictionCell("Wear Hearing Protection", "wear_hearing_protection")}
            </tr>
            <tr>
              {renderRestrictionCell("Confined Spaces", "confined_spaces")}
              {renderRestrictionCell("Chemical Exposure", "chemical_exposure")}
              {renderRestrictionCell("Wear Spectacles", "wear_spectacles")}
              {renderRestrictionCell("Remain on Treatment for Chronic Conditions", "remain_on_treatment_for_chronic_conditions")}
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  const renderFitnessAssessmentSection = () => {
    const certification = data.structured_data?.certification || 
                         data.certification || 
                         {};
    
    // Try to find fitness status from multiple possible locations
    const currentFitness = certification.fitness_status || 
                          certification.medical_fitness || 
                          certification.fit_status || 
                          data.medical_fitness || 
                          '';
    
    console.log('Current fitness status:', currentFitness);
    
    return (
      <div className="mb-4">
        <h3 className="text-lg font-medium mb-2">Fitness Assessment</h3>
        <table className="w-full border border-gray-400">
          <tbody>
            <tr>
              {['FIT', 'Fit with Restriction', 'Fit with Condition', 'Temporary Unfit', 'UNFIT'].map((status) => (
                <th key={status} className="border border-gray-400 p-2 text-center">
                  {status}
                  <div className="flex justify-center mt-1">
                    <Checkbox 
                      checked={currentFitness === status || 
                              certification[status.toLowerCase().replace(/\s/g, '_')] ||
                              (status === 'FIT' && certification.fit) ||
                              (status === 'Fit with Restriction' && certification.fit_with_restrictions) ||
                              (status === 'Fit with Condition' && certification.fit_with_condition) ||
                              (status === 'Temporary Unfit' && certification.temporarily_unfit) ||
                              (status === 'UNFIT' && certification.unfit)} 
                      onCheckedChange={(checked) => {
                        if (checked) {
                          // Clear other fitness options and set the selected one
                          updateEditableData(['structured_data', 'certification', 'fitness_status'], status);
                          updateEditableData(['structured_data', 'certification', 'fit'], status === 'FIT');
                          updateEditableData(['structured_data', 'certification', 'fit_with_restrictions'], status === 'Fit with Restriction');
                          updateEditableData(['structured_data', 'certification', 'fit_with_condition'], status === 'Fit with Condition');
                          updateEditableData(['structured_data', 'certification', 'temporarily_unfit'], status === 'Temporary Unfit');
                          updateEditableData(['structured_data', 'certification', 'unfit'], status === 'UNFIT');
                        }
                      }}
                    />
                  </div>
                </th>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  const renderCommentsSection = () => {
    const certification = data.structured_data?.certification || 
                         data.certification || 
                         {};
    
    return (
      <div className="mb-4">
        <div className="font-semibold text-sm mb-1">Comments:</div>
        <Textarea 
          className="border border-gray-400 p-2 min-h-16 text-sm w-full resize-none focus-visible:ring-0" 
          value={certification.comments || certification.notes || ''}
          onChange={(e) => updateEditableData(['structured_data', 'certification', 'comments'], e.target.value)}
          placeholder="Enter any additional comments"
        />
      </div>
    );
  };
  
  return (
    <div className="space-y-6 px-6">
      {renderPatientSection()}
      <Separator />
      {renderExaminationTypeSection()}
      <Separator />
      {renderTestResultsSection()}
      <Separator />
      {renderFollowUpSection()}
      <Separator />
      {renderRestrictionsSection()}
      <Separator />
      {renderFitnessAssessmentSection()}
      <Separator />
      {renderCommentsSection()}
    </div>
  );
};

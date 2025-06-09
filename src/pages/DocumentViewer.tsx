{/* Extracted Data Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5" />
                Extracted Data (Editable)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <Edit className="h-4 w-4 inline mr-2" />
                  Compare with the original document and edit the extracted data as needed.
                </p>
              </div>
              
              <CertificateTemplate 
                extractedData={validatedData}
                editable={true}
                onDataChange={handleDataChange}
                templateType={selectedTemplate}
              />

              <div className="mt-4 pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => setIsValidationMode(false)}
                >
                  Exit Validation Mode
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Certificate Template - regular view mode */}
      {isProcessed && isCertificate && validatedData && !isValidationMode && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Certificate Preview ({selectedTemplate === 'modern' ? 'Modern' : 'Historical'} Template)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CertificateTemplate 
              extractedData={validatedData}
              editable={false}
              templateType={selectedTemplate}
            />
          </CardContent>
        </Card>
      )}

      {/* Extracted Data - for non-certificate documents or if no template available */}
      {isProcessed && document.extracted_data && (!isCertificate || !validatedData) && (
        <Card>
          <CardHeader>
            <CardTitle>Extracted Data</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm bg-gray-50 p-4 rounded-lg overflow-auto">
              {JSON.stringify(document.extracted_data, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Processing Status */}
      {!isProcessed && (
        <Alert>
          <FileText className="h-4 w-4" />
          <AlertDescription>
            This document is still being processed. Data extraction and validation features will be available once processing is complete.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

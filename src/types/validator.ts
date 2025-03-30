
export interface CertificateValidatorProps {
  validatorData: any;
  isValidating: boolean;
  onValidate: () => Promise<void>;
}

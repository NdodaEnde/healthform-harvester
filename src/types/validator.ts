
export interface CertificateValidatorProps {
  validator: any;
  isValidating: boolean;
  onValidate: () => Promise<void>;
}

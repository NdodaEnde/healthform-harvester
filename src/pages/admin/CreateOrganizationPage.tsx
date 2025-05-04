
import { useNavigate } from "react-router-dom";
import OrganizationForm from "@/components/admin/OrganizationForm";

export default function CreateOrganizationPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Create Organization</h1>
      <OrganizationForm />
    </div>
  );
}

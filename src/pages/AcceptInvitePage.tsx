
import { useSearchParams } from "react-router-dom";
import AcceptInviteForm from "@/components/AcceptInviteForm";
import { FileText } from "lucide-react";

export default function AcceptInvitePage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="h-6 w-6" />
            <span className="font-medium text-lg">HealthForm Harvester</span>
          </div>
        </div>
      </header>
      
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {token ? (
            <AcceptInviteForm token={token} />
          ) : (
            <div className="bg-card border rounded-lg p-6 shadow-sm">
              <h1 className="text-xl font-bold mb-4">Invalid Invitation</h1>
              <p>No invitation token was provided. Please check the link and try again.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

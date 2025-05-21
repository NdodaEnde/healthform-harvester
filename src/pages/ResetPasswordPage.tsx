
import ResetPasswordForm from "@/components/ResetPasswordForm";
import { FileText } from "lucide-react";
import { Link } from "react-router-dom";

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <FileText className="h-6 w-6" />
            <span className="font-medium text-lg">SurgiScan</span>
          </Link>
        </div>
      </header>
      
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <ResetPasswordForm />
        </div>
      </main>
    </div>
  );
}

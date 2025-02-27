
import { Loader2 } from "lucide-react";

const LoadingFallback = () => {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center">
      <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
      <p className="text-muted-foreground animate-pulse text-balance">Loading application...</p>
    </div>
  );
};

export default LoadingFallback;

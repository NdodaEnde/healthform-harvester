
import { Loader2, Activity } from "lucide-react";

const LoadingFallback = () => {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-background to-muted/20">
      <div className="relative">
        {/* Outer spinning ring */}
        <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-spin" style={{ width: '80px', height: '80px' }}></div>
        
        {/* Inner pulsing circle */}
        <div className="flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 animate-pulse">
          <Activity className="h-8 w-8 text-primary animate-bounce" />
        </div>
      </div>
      
      <div className="mt-8 text-center space-y-2 animate-fade-in" style={{ animationDelay: '0.5s' }}>
        <h2 className="text-xl font-semibold text-foreground">Loading Application</h2>
        <p className="text-muted-foreground text-sm max-w-md">
          Preparing your healthcare management platform...
        </p>
      </div>
      
      {/* Loading dots animation */}
      <div className="flex space-x-1 mt-4 animate-fade-in" style={{ animationDelay: '1s' }}>
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="w-2 h-2 bg-primary rounded-full animate-bounce"
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>
    </div>
  );
};

export default LoadingFallback;

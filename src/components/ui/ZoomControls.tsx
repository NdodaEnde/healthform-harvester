
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

interface ZoomControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  className?: string;
}

export function ZoomControls({
  onZoomIn,
  onZoomOut,
  onReset,
  className
}: ZoomControlsProps) {
  return (
    <div className={cn("flex items-center gap-1 bg-background/80 backdrop-blur-sm p-1 rounded-md shadow-sm", className)}>
      <Button
        variant="ghost"
        size="icon"
        onClick={onZoomIn}
        className="h-8 w-8"
        title="Zoom in"
      >
        <ZoomIn className="h-4 w-4" />
        <span className="sr-only">Zoom in</span>
      </Button>
      
      <Button
        variant="ghost"
        size="icon"
        onClick={onZoomOut}
        className="h-8 w-8"
        title="Zoom out"
      >
        <ZoomOut className="h-4 w-4" />
        <span className="sr-only">Zoom out</span>
      </Button>
      
      <Button
        variant="ghost"
        onClick={onReset}
        size="sm"
        className="h-8 text-xs"
        title="Reset zoom"
      >
        <RotateCcw className="h-3 w-3 mr-1" />
        Reset
      </Button>
    </div>
  );
}


import * as React from "react";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ZoomControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  zoomLevel: number;
  className?: string;
}

export function ZoomControls({
  onZoomIn,
  onZoomOut,
  onReset,
  zoomLevel,
  className,
}: ZoomControlsProps) {
  return (
    <div className={cn("flex items-center gap-2 bg-background/80 backdrop-blur-sm rounded-md p-1 shadow-sm", className)}>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={onZoomOut}
        disabled={zoomLevel <= 0.5}
        aria-label="Zoom out"
      >
        <ZoomOut className="h-4 w-4" />
      </Button>

      <div className="text-xs font-medium px-2">
        {Math.round(zoomLevel * 100)}%
      </div>

      <Button 
        variant="outline" 
        size="sm" 
        onClick={onZoomIn}
        disabled={zoomLevel >= 3}
        aria-label="Zoom in"
      >
        <ZoomIn className="h-4 w-4" />
      </Button>
      
      <Button 
        variant="outline" 
        size="sm" 
        onClick={onReset}
        aria-label="Reset zoom"
      >
        <Maximize2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

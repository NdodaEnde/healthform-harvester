
import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { usePackage } from '@/contexts/PackageContext';

interface FeatureSkeletonProps {
  type?: 'card' | 'chart' | 'table' | 'list';
  title?: string;
  rows?: number;
  animated?: boolean;
  className?: string;
}

const FeatureSkeleton: React.FC<FeatureSkeletonProps> = ({
  type = 'card',
  title,
  rows = 3,
  animated = true,
  className
}) => {
  const { colors } = usePackage();

  const skeletonClass = animated ? "animate-pulse" : "";

  if (type === 'card') {
    return (
      <Card className={`${colors.background} border-dashed ${className}`}>
        <CardHeader className="pb-3">
          {title && (
            <Skeleton className={`h-5 w-32 ${skeletonClass}`} />
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className={`h-4 w-full ${skeletonClass}`} />
              <Skeleton className={`h-4 w-3/4 ${skeletonClass}`} />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (type === 'chart') {
    return (
      <Card className={`${colors.background} border-dashed ${className}`}>
        <CardHeader className="pb-3">
          {title && (
            <Skeleton className={`h-5 w-40 ${skeletonClass}`} />
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-end space-x-2 h-32">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton 
                  key={i} 
                  className={`flex-1 ${skeletonClass}`}
                  style={{ height: `${Math.random() * 80 + 20}%` }}
                />
              ))}
            </div>
            <div className="flex justify-between">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className={`h-3 w-8 ${skeletonClass}`} />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (type === 'table') {
    return (
      <Card className={`${colors.background} border-dashed ${className}`}>
        {title && (
          <CardHeader className="pb-3">
            <Skeleton className={`h-5 w-32 ${skeletonClass}`} />
          </CardHeader>
        )}
        <CardContent>
          <div className="space-y-3">
            {/* Table header */}
            <div className="flex space-x-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className={`h-4 flex-1 ${skeletonClass}`} />
              ))}
            </div>
            {/* Table rows */}
            {Array.from({ length: rows }).map((_, i) => (
              <div key={i} className="flex space-x-4">
                {Array.from({ length: 4 }).map((_, j) => (
                  <Skeleton key={j} className={`h-3 flex-1 ${skeletonClass}`} />
                ))}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (type === 'list') {
    return (
      <Card className={`${colors.background} border-dashed ${className}`}>
        {title && (
          <CardHeader className="pb-3">
            <Skeleton className={`h-5 w-32 ${skeletonClass}`} />
          </CardHeader>
        )}
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: rows }).map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <Skeleton className={`h-8 w-8 rounded-full ${skeletonClass}`} />
                <div className="flex-1 space-y-2">
                  <Skeleton className={`h-4 w-3/4 ${skeletonClass}`} />
                  <Skeleton className={`h-3 w-1/2 ${skeletonClass}`} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
};

export default FeatureSkeleton;

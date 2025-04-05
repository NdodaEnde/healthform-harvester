
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StatsSummaryCardsProps {
  totalDocuments: number;
  isLoading: boolean;
  fitnessStatuses: Record<string, number>;
  className?: string;
}

export default function StatsSummaryCards({ totalDocuments, isLoading, fitnessStatuses, className }: StatsSummaryCardsProps) {
  // Calculate percentages
  const totalFit = fitnessStatuses["Fit"] || 0;
  const totalWithRestrictions = fitnessStatuses["Fit with Restrictions"] || 0;
  const percentageFit = totalDocuments > 0 ? ((totalFit / totalDocuments) * 100).toFixed(1) + "%" : "0%";
  const percentageRestrictions = totalDocuments > 0 ? ((totalWithRestrictions / totalDocuments) * 100).toFixed(1) + "%" : "0%";
  
  // Sample data for growth indicators - in a real app these would be calculated
  const growthAssessments = '+12%';
  const growthTests = '+8.2%';

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            Total Assessments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            {isLoading ? '...' : totalDocuments.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            {growthAssessments} from previous period
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            Fit for Work
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            {isLoading ? '...' : totalFit.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            {percentageFit} of total
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            With Restrictions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            {isLoading ? '...' : totalWithRestrictions.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            {percentageRestrictions} of total
          </p>
        </CardContent>
      </Card>
    </>
  );
}

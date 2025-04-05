
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StatsSummaryCardsProps {
  className?: string;
}

export default function StatsSummaryCards({ className }: StatsSummaryCardsProps) {
  // Sample examination stats data
  const examStats = {
    totalAssessments: 2854,
    fitForWork: 2345,
    withRestrictions: 412,
    totalMedicalTests: 5021,
    growthAssessments: '+12%',
    percentageFit: '82.2%',
    percentageRestrictions: '14.4%',
    growthTests: '+8.2%'
  };

  return (
    <div className={`grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 ${className}`}>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            Total Assessments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            {examStats.totalAssessments.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            {examStats.growthAssessments} from previous period
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
            {examStats.fitForWork.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            {examStats.percentageFit} of total
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
            {examStats.withRestrictions.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            {examStats.percentageRestrictions} of total
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            Total Medical Tests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            {examStats.totalMedicalTests.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            {examStats.growthTests} from last month
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

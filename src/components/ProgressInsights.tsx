
import React from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface ProgressInsightsProps {
  weeklyProgress: number;
  totalHabits: number;
  completedToday: number;
}

const ProgressInsights = ({ weeklyProgress, totalHabits, completedToday }: ProgressInsightsProps) => {
  return (
    <Card className="p-4">
      <h2 className="font-semibold mb-4">Progress Insights</h2>
      <div className="space-y-4">
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm text-muted-foreground">Weekly Progress</span>
            <span className="text-sm font-medium">{weeklyProgress}%</span>
          </div>
          <Progress value={weeklyProgress} className="h-2" />
        </div>
        <div className="flex justify-between text-sm">
          <span>Completed today: {completedToday}/{totalHabits}</span>
        </div>
      </div>
    </Card>
  );
};

export default ProgressInsights;

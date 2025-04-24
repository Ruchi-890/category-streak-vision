
import React from "react";
import { Card } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";

interface MonthlyViewProps {
  selectedDates: Date[];
}

const MonthlyView = ({ selectedDates }: MonthlyViewProps) => {
  return (
    <Card className="p-4">
      <Calendar
        mode="multiple"
        selected={selectedDates}
        className="rounded-md"
      />
    </Card>
  );
};

export default MonthlyView;

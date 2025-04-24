
import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface HabitCardProps {
  name: string;
  category: string;
  streak: number;
  completed: boolean;
  onComplete: () => void;
}

const HabitCard = ({ name, category, streak, completed, onComplete }: HabitCardProps) => {
  return (
    <Card className={cn(
      "p-4 transition-all duration-300 animate-scale-in",
      completed ? "border-primary border-2" : ""
    )}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-lg">{name}</h3>
          <p className="text-sm text-muted-foreground">{category}</p>
        </div>
        <Button
          variant={completed ? "ghost" : "outline"}
          size="icon"
          onClick={onComplete}
          className={cn(
            "transition-all duration-300",
            completed ? "bg-primary text-white" : ""
          )}
        >
          <Check className="h-4 w-4" />
        </Button>
      </div>
      <div className="mt-4 flex items-center gap-2">
        <Star className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">{streak} day streak</span>
      </div>
    </Card>
  );
};

export default HabitCard;

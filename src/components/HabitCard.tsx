
import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Star, Trash2, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface HabitCardProps {
  name: string;
  category: string;
  streak: number;
  completed: boolean;
  onComplete: () => void;
  onDelete: () => void;
}

const HabitCard = ({ name, category, streak, completed, onComplete, onDelete }: HabitCardProps) => {
  return (
    <Card className={cn(
      "p-4 transition-all duration-300 animate-scale-in",
      completed ? "border-green-500 border-2 bg-green-50" : "border-gray-200"
    )}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className={cn(
            "font-semibold text-lg",
            completed ? "text-green-700" : "text-gray-900"
          )}>
            {name}
          </h3>
          <p className="text-sm text-muted-foreground">{category}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={completed ? "ghost" : "outline"}
            size="icon"
            onClick={onComplete}
            disabled={completed}
            className={cn(
              "transition-all duration-300",
              completed 
                ? "bg-green-600 text-white cursor-not-allowed" 
                : "hover:bg-green-50 hover:border-green-300"
            )}
          >
            {completed ? <CheckCircle className="h-4 w-4" /> : <Check className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            className="text-red-500 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2">
        <Star className={cn(
          "h-4 w-4",
          streak > 0 ? "text-yellow-500" : "text-gray-400"
        )} />
        <span className={cn(
          "text-sm font-medium",
          streak > 0 ? "text-yellow-600" : "text-gray-500"
        )}>
          {streak} day streak
        </span>
        {completed && (
          <span className="text-xs text-green-600 ml-2">✓ Completed today</span>
        )}
      </div>
    </Card>
  );
};

export default HabitCard;

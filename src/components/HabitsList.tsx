
import React from "react";
import { Button } from "@/components/ui/button";
import HabitCard from "@/components/HabitCard";

interface Habit {
  id: string;
  name: string;
  category: string;
  streak: number;
  completed: boolean;
}

interface HabitsListProps {
  habits: Habit[];
  onComplete: (id: string) => void;
  onDelete: (habit: Habit) => void;
  onAddHabits: () => void;
}

const HabitsList = ({ habits, onComplete, onDelete, onAddHabits }: HabitsListProps) => {
  if (habits.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground mb-4">No habits found for this category.</p>
        <Button onClick={onAddHabits}>Add Some Habits</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {habits.map(habit => (
        <HabitCard
          key={habit.id}
          {...habit}
          onComplete={() => onComplete(habit.id)}
          onDelete={() => onDelete(habit)}
        />
      ))}
    </div>
  );
};

export default HabitsList;

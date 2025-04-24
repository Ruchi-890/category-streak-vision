
import React, { useState } from "react";
import HabitCard from "@/components/HabitCard";
import MonthlyView from "@/components/MonthlyView";
import ProgressInsights from "@/components/ProgressInsights";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const SAMPLE_HABITS = [
  { id: 1, name: "Morning Meditation", category: "Health", streak: 5, completed: false },
  { id: 2, name: "Read 30 mins", category: "Learning", streak: 3, completed: false },
  { id: 3, name: "Exercise", category: "Fitness", streak: 7, completed: false },
];

const CATEGORIES = ["All", "Health", "Learning", "Fitness"];

const Index = () => {
  const [habits, setHabits] = useState(SAMPLE_HABITS);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const completedDates = [new Date()];

  const toggleHabit = (id: number) => {
    setHabits(habits.map(habit =>
      habit.id === id ? { ...habit, completed: !habit.completed } : habit
    ));
  };

  const filteredHabits = selectedCategory === "All"
    ? habits
    : habits.filter(habit => habit.category === selectedCategory);

  const completedToday = habits.filter(h => h.completed).length;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">Habit Tracker</h1>
          <div className="flex gap-2">
            {CATEGORIES.map(category => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                onClick={() => setSelectedCategory(category)}
                className="transition-all duration-300"
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            {filteredHabits.map(habit => (
              <HabitCard
                key={habit.id}
                {...habit}
                onComplete={() => toggleHabit(habit.id)}
              />
            ))}
          </div>
          <div className="space-y-6">
            <ProgressInsights
              weeklyProgress={75}
              totalHabits={habits.length}
              completedToday={completedToday}
            />
            <MonthlyView selectedDates={completedDates} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;


import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import MonthlyView from "@/components/MonthlyView";
import ProgressInsights from "@/components/ProgressInsights";
import StreakView from "@/components/StreakView";
import CategoryFilter from "@/components/CategoryFilter";
import HabitsList from "@/components/HabitsList";
import DeleteHabitDialog from "@/components/DeleteHabitDialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useHabits } from "@/hooks/useHabits";
import { useWeeklyProgress } from "@/hooks/useWeeklyProgress";

interface Habit {
  id: string;
  name: string;
  category: string;
  streak: number;
  completed: boolean;
}

const Index = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { habits, loading, toggleHabit, deleteHabit } = useHabits();
  const { weeklyProgress } = useWeeklyProgress();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showStreaks, setShowStreaks] = useState(false);
  const [habitToDelete, setHabitToDelete] = useState<Habit | null>(null);

  const handleLogout = async () => {
    await logout();
  };

  const handleDeleteHabit = async (habit: Habit) => {
    await deleteHabit(habit);
    setHabitToDelete(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div>Loading your habits...</div>
      </div>
    );
  }

  if (habits.length === 0) {
    navigate('/setup');
    return null;
  }

  if (showStreaks) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <StreakView onClose={() => setShowStreaks(false)} />
        </div>
      </div>
    );
  }

  const filteredHabits = selectedCategory === "All"
    ? habits
    : habits.filter(habit => habit.category === selectedCategory);

  const completedToday = habits.filter(h => h.completed).length;
  const completedDates = [new Date()];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Habit Tracker</h1>
            <p className="text-muted-foreground">Welcome back, {user?.email}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowStreaks(true)}>
              View Streaks
            </Button>
            <Button variant="outline" onClick={() => navigate('/setup')}>
              Add More Habits
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>

        <CategoryFilter 
          selectedCategory={selectedCategory}
          onCategorySelect={setSelectedCategory}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            <HabitsList
              habits={filteredHabits}
              onComplete={toggleHabit}
              onDelete={setHabitToDelete}
              onAddHabits={() => navigate('/setup')}
            />
          </div>
          <div className="space-y-6">
            <ProgressInsights
              weeklyProgress={weeklyProgress}
              totalHabits={habits.length}
              completedToday={completedToday}
            />
            <MonthlyView selectedDates={completedDates} />
          </div>
        </div>
      </div>

      <DeleteHabitDialog
        habit={habitToDelete}
        onClose={() => setHabitToDelete(null)}
        onConfirm={handleDeleteHabit}
      />
    </div>
  );
};

export default Index;

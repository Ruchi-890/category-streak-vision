
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import HabitCard from "@/components/HabitCard";
import MonthlyView from "@/components/MonthlyView";
import ProgressInsights from "@/components/ProgressInsights";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";

const CATEGORIES = ["All", "Health", "Learning", "Fitness", "Personal", "Mental Health", "Productivity"];

const Index = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [habits, setHabits] = useState<Array<{id: number, name: string, category: string, streak: number, completed: boolean}>>([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user has completed setup
    const setupCompleted = localStorage.getItem('setupCompleted');
    const savedHabits = localStorage.getItem('userHabits');
    
    if (!setupCompleted || !savedHabits) {
      navigate('/setup');
      return;
    }

    // Load habits from localStorage
    try {
      const parsedHabits = JSON.parse(savedHabits);
      setHabits(parsedHabits);
    } catch (error) {
      console.error('Error loading habits:', error);
      navigate('/setup');
    }
    
    setLoading(false);
  }, [navigate]);

  const toggleHabit = (id: number) => {
    const updatedHabits = habits.map(habit =>
      habit.id === id ? { ...habit, completed: !habit.completed } : habit
    );
    setHabits(updatedHabits);
    localStorage.setItem('userHabits', JSON.stringify(updatedHabits));
  };

  const handleLogout = async () => {
    await logout();
    // Clear local data on logout
    localStorage.removeItem('userHabits');
    localStorage.removeItem('setupCompleted');
  };

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <div>Loading your habits...</div>
    </div>;
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
            <Button variant="outline" onClick={() => navigate('/setup')}>
              Add More Habits
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            {filteredHabits.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No habits found for this category.</p>
                <Button onClick={() => navigate('/setup')}>Add Some Habits</Button>
              </div>
            ) : (
              filteredHabits.map(habit => (
                <HabitCard
                  key={habit.id}
                  {...habit}
                  onComplete={() => toggleHabit(habit.id)}
                />
              ))
            )}
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

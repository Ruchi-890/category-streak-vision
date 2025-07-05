import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import HabitCard from "@/components/HabitCard";
import MonthlyView from "@/components/MonthlyView";
import ProgressInsights from "@/components/ProgressInsights";
import StreakView from "@/components/StreakView";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";

const CATEGORIES = ["All", "Health", "Learning", "Fitness", "Personal", "Mental Health", "Productivity"];

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
  const [habits, setHabits] = useState<Habit[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [showStreaks, setShowStreaks] = useState(false);

  useEffect(() => {
    if (user) {
      loadHabits();
    }
  }, [user]);

  const loadHabits = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error loading habits:', error);
        toast.error('Failed to load habits');
        return;
      }

      if (!data || data.length === 0) {
        // No habits found, redirect to setup
        navigate('/setup');
        return;
      }

      setHabits(data);
    } catch (error) {
      console.error('Unexpected error loading habits:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const toggleHabit = async (id: string) => {
    const habit = habits.find(h => h.id === id);
    if (!habit || !user) return;

    const newCompletedState = !habit.completed;
    
    try {
      // Update the habit in the database
      const { error } = await supabase
        .from('habits')
        .update({ 
          completed: newCompletedState,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating habit:', error);
        toast.error('Failed to update habit');
        return;
      }

      // Update local state
      setHabits(prevHabits =>
        prevHabits.map(h =>
          h.id === id ? { ...h, completed: newCompletedState } : h
        )
      );

      // Handle habit completion tracking
      if (newCompletedState) {
        const today = new Date().toISOString().split('T')[0];
        
        const { error: completionError } = await supabase
          .from('habit_completions')
          .insert({
            habit_id: id,
            user_id: user.id,
            completed_date: today
          });

        if (completionError && !completionError.message.includes('duplicate key')) {
          console.error('Error tracking completion:', completionError);
        }
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      toast.error('An unexpected error occurred');
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <div>Loading your habits...</div>
    </div>;
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

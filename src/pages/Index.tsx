
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import HabitCard from "@/components/HabitCard";
import MonthlyView from "@/components/MonthlyView";
import ProgressInsights from "@/components/ProgressInsights";
import StreakView from "@/components/StreakView";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  const [habitToDelete, setHabitToDelete] = useState<Habit | null>(null);

  useEffect(() => {
    if (user) {
      loadHabits();
    }
  }, [user]);

  const calculateStreak = async (habitId: string): Promise<number> => {
    if (!user) return 0;

    try {
      const { data, error } = await supabase
        .from('habit_completions')
        .select('completed_date')
        .eq('habit_id', habitId)
        .eq('user_id', user.id)
        .order('completed_date', { ascending: false });

      if (error) {
        console.error('Error fetching completion data:', error);
        return 0;
      }

      if (!data || data.length === 0) return 0;

      let streak = 0;
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      
      // Check if completed today
      const completedToday = data.some(completion => completion.completed_date === todayStr);
      
      if (!completedToday) return 0;
      
      // Calculate consecutive days from today backwards
      const completionDates = data.map(d => d.completed_date).sort((a, b) => b.localeCompare(a));
      
      for (let i = 0; i < completionDates.length; i++) {
        const expectedDate = new Date(today);
        expectedDate.setDate(today.getDate() - i);
        const expectedDateStr = expectedDate.toISOString().split('T')[0];
        
        if (completionDates[i] === expectedDateStr) {
          streak++;
        } else {
          break;
        }
      }

      return streak;
    } catch (error) {
      console.error('Error calculating streak:', error);
      return 0;
    }
  };

  const checkTodayCompletion = async (habitId: string): Promise<boolean> => {
    if (!user) return false;

    const today = new Date().toISOString().split('T')[0];
    
    try {
      const { data, error } = await supabase
        .from('habit_completions')
        .select('id')
        .eq('habit_id', habitId)
        .eq('user_id', user.id)
        .eq('completed_date', today)
        .maybeSingle();

      if (error) {
        console.error('Error checking today completion:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Error checking today completion:', error);
      return false;
    }
  };

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
        navigate('/setup');
        return;
      }

      // Check today's completion status and calculate streaks for each habit
      const habitsWithCorrectStatus = await Promise.all(
        data.map(async (habit) => {
          const completedToday = await checkTodayCompletion(habit.id);
          const currentStreak = await calculateStreak(habit.id);
          
          return {
            ...habit,
            completed: completedToday,
            streak: currentStreak
          };
        })
      );

      setHabits(habitsWithCorrectStatus);
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
    const today = new Date().toISOString().split('T')[0];
    
    try {
      if (newCompletedState) {
        // Mark as completed - add completion record
        const { error: completionError } = await supabase
          .from('habit_completions')
          .insert({
            habit_id: id,
            user_id: user.id,
            completed_date: today
          });

        if (completionError && !completionError.message.includes('duplicate key')) {
          console.error('Error tracking completion:', completionError);
          toast.error('Failed to mark habit as completed');
          return;
        }
      } else {
        // Mark as not completed - remove completion record
        const { error: deleteError } = await supabase
          .from('habit_completions')
          .delete()
          .eq('habit_id', id)
          .eq('user_id', user.id)
          .eq('completed_date', today);

        if (deleteError) {
          console.error('Error removing completion:', deleteError);
          toast.error('Failed to unmark habit');
          return;
        }
      }

      // Calculate new streak
      const newStreak = await calculateStreak(id);

      // Update the habit's streak in the database
      const { error: updateError } = await supabase
        .from('habits')
        .update({ 
          streak: newStreak,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Error updating habit streak:', updateError);
        toast.error('Failed to update streak');
        return;
      }

      // Update local state
      setHabits(prevHabits =>
        prevHabits.map(h =>
          h.id === id ? { ...h, completed: newCompletedState, streak: newStreak } : h
        )
      );

      if (newCompletedState) {
        toast.success(`Great! ${habit.name} completed for today!`);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      toast.error('An unexpected error occurred');
    }
  };

  const deleteHabit = async (habit: Habit) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('habits')
        .delete()
        .eq('id', habit.id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting habit:', error);
        toast.error('Failed to delete habit');
        return;
      }

      setHabits(prevHabits => prevHabits.filter(h => h.id !== habit.id));
      toast.success(`"${habit.name}" habit deleted successfully`);
      setHabitToDelete(null);
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
                  onDelete={() => setHabitToDelete(habit)}
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

      <AlertDialog open={habitToDelete !== null} onOpenChange={() => setHabitToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Habit</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{habitToDelete?.name}"? This action cannot be undone and will remove all associated data including streaks and completion history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => habitToDelete && deleteHabit(habitToDelete)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Habit
            </AlertDialogAction>
          </AlertDialogAction>
        </div>
      </AlertDialog>
    </div>
  );
};

export default Index;

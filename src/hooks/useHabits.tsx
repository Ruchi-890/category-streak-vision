
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/components/ui/sonner";

interface Habit {
  id: string;
  name: string;
  category: string;
  streak: number;
  completed: boolean;
}

export const useHabits = () => {
  const { user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);

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
        return [];
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
      return habitsWithCorrectStatus;
    } catch (error) {
      console.error('Unexpected error loading habits:', error);
      toast.error('An unexpected error occurred');
      return [];
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
    } catch (error) {
      console.error('Unexpected error:', error);
      toast.error('An unexpected error occurred');
    }
  };

  useEffect(() => {
    if (user) {
      loadHabits();
    }
  }, [user]);

  return {
    habits,
    loading,
    toggleHabit,
    deleteHabit,
    loadHabits
  };
};

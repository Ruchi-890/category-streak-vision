
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
      today.setHours(0, 0, 0, 0);
      
      // Sort completion dates
      const completionDates = data.map(d => new Date(d.completed_date + 'T00:00:00')).sort((a, b) => b.getTime() - a.getTime());
      
      console.log('Calculating streak for habit:', habitId, 'completionDates:', completionDates);
      
      // Calculate consecutive days from most recent completion
      for (let i = 0; i < completionDates.length; i++) {
        const completionDate = completionDates[i];
        const expectedDate = new Date(today);
        expectedDate.setDate(today.getDate() - i);
        
        console.log('Comparing:', completionDate.toDateString(), 'with expected:', expectedDate.toDateString());
        
        if (completionDate.getTime() === expectedDate.getTime()) {
          streak++;
        } else {
          break;
        }
      }

      console.log('Final streak:', streak);
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

      const isCompleted = !!data;
      console.log('Habit', habitId, 'completed today:', isCompleted);
      return isCompleted;
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
        setHabits([]);
        return;
      }

      console.log('Raw habits from database:', data);

      // Check today's completion status and calculate streaks for each habit
      const habitsWithCorrectStatus = await Promise.all(
        data.map(async (habit) => {
          const completedToday = await checkTodayCompletion(habit.id);
          const currentStreak = await calculateStreak(habit.id);
          
          // Always update the completed status to false in the database if it's not completed today
          // This ensures habits reset daily
          if (habit.completed && !completedToday) {
            console.log('Resetting completed status for habit:', habit.name);
            await supabase
              .from('habits')
              .update({ completed: false })
              .eq('id', habit.id)
              .eq('user_id', user.id);
          }
          
          return {
            ...habit,
            completed: completedToday,
            streak: currentStreak
          };
        })
      );

      console.log('Processed habits:', habitsWithCorrectStatus);
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

    // Only allow checking habits, not unchecking
    if (habit.completed) {
      toast.error('This habit is already completed for today!');
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    
    try {
      console.log('Marking habit as completed:', habit.name, 'for date:', today);
      
      // Mark as completed - add completion record
      const { error: completionError } = await supabase
        .from('habit_completions')
        .insert({
          habit_id: id,
          user_id: user.id,
          completed_date: today
        });

      if (completionError) {
        if (completionError.message.includes('duplicate key')) {
          toast.error('This habit is already completed for today!');
          return;
        }
        console.error('Error tracking completion:', completionError);
        toast.error('Failed to mark habit as completed');
        return;
      }

      // Calculate new streak
      const newStreak = await calculateStreak(id);
      console.log('New streak calculated:', newStreak);

      // Update the habit's streak AND completed status in the database
      const { error: updateError } = await supabase
        .from('habits')
        .update({ 
          streak: newStreak,
          completed: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Error updating habit:', updateError);
        toast.error('Failed to update habit');
        return;
      }

      // Update local state
      setHabits(prevHabits =>
        prevHabits.map(h =>
          h.id === id ? { ...h, completed: true, streak: newStreak } : h
        )
      );

      console.log('Habit successfully completed and updated');
      toast.success(`Great! ${habit.name} completed for today! 🎉`);
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

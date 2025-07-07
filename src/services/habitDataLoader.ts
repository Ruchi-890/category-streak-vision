
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import { checkTodayCompletion, calculateStreak } from "./habitCalculations";

interface Habit {
  id: string;
  name: string;
  category: string;
  streak: number;
  completed: boolean;
}

export const loadUserHabits = async (userId: string): Promise<Habit[]> => {
  try {
    console.log('Loading habits for user:', userId);
    
    const { data, error } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('Error loading habits:', error);
      toast.error('Failed to load habits');
      return [];
    }

    if (!data || data.length === 0) {
      console.log('No habits found for user');
      return [];
    }

    console.log('Raw habits from database:', data);

    // Process each habit to get correct completion status and streak
    const processedHabits = await Promise.all(
      data.map(async (habit) => {
        const completedToday = await checkTodayCompletion(habit.id, userId);
        const currentStreak = await calculateStreak(habit.id, userId);
        
        // Reset completed status in database if habit is marked completed but wasn't actually completed today
        if (habit.completed && !completedToday) {
          console.log('Resetting completed status for habit:', habit.name);
          await supabase
            .from('habits')
            .update({ completed: false })
            .eq('id', habit.id)
            .eq('user_id', userId);
        }
        
        // Update completed status in database if habit wasn't marked completed but was actually completed today
        if (!habit.completed && completedToday) {
          console.log('Setting completed status for habit:', habit.name);
          await supabase
            .from('habits')
            .update({ completed: true, streak: currentStreak })
            .eq('id', habit.id)
            .eq('user_id', userId);
        }
        
        return {
          ...habit,
          completed: completedToday,
          streak: currentStreak
        };
      })
    );

    console.log('Processed habits:', processedHabits);
    return processedHabits;
  } catch (error) {
    console.error('Unexpected error loading habits:', error);
    toast.error('An unexpected error occurred');
    return [];
  }
};

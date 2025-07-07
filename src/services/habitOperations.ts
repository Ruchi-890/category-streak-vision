
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import { calculateStreak } from "./habitCalculations";

interface Habit {
  id: string;
  name: string;
  category: string;
  streak: number;
  completed: boolean;
}

export const toggleHabitCompletion = async (
  habitId: string, 
  userId: string, 
  habitName: string,
  isCurrentlyCompleted: boolean
): Promise<{ success: boolean; newStreak?: number }> => {
  // Only allow checking habits, not unchecking
  if (isCurrentlyCompleted) {
    toast.error('This habit is already completed for today!');
    return { success: false };
  }

  const today = new Date().toISOString().split('T')[0];
  
  try {
    console.log('Marking habit as completed:', habitName, 'for date:', today);
    
    // First, add completion record
    const { error: completionError } = await supabase
      .from('habit_completions')
      .insert({
        habit_id: habitId,
        user_id: userId,
        completed_date: today
      });

    if (completionError) {
      if (completionError.message.includes('duplicate key')) {
        toast.error('This habit is already completed for today!');
        return { success: false };
      }
      console.error('Error tracking completion:', completionError);
      toast.error('Failed to mark habit as completed');
      return { success: false };
    }

    // Calculate new streak
    const newStreak = await calculateStreak(habitId, userId);
    console.log('New streak calculated:', newStreak);

    // Update the habit's completed status and streak in the database
    const { error: updateError } = await supabase
      .from('habits')
      .update({ 
        completed: true,
        streak: newStreak,
        updated_at: new Date().toISOString()
      })
      .eq('id', habitId)
      .eq('user_id', userId);

    if (updateError) {
      console.error('Error updating habit completed status:', updateError);
      toast.error('Failed to update habit status');
      return { success: false };
    }

    console.log('Habit successfully completed and updated in database');
    toast.success(`Great! ${habitName} completed for today! 🎉`);
    return { success: true, newStreak };
  } catch (error) {
    console.error('Unexpected error:', error);
    toast.error('An unexpected error occurred');
    return { success: false };
  }
};

export const deleteHabitFromDb = async (habitId: string, userId: string, habitName: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('habits')
      .delete()
      .eq('id', habitId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting habit:', error);
      toast.error('Failed to delete habit');
      return false;
    }

    toast.success(`"${habitName}" habit deleted successfully`);
    return true;
  } catch (error) {
    console.error('Unexpected error:', error);
    toast.error('An unexpected error occurred');
    return false;
  }
};

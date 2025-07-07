
import { supabase } from "@/integrations/supabase/client";

export const calculateStreak = async (habitId: string, userId: string): Promise<number> => {
  try {
    console.log('Calculating streak for habit:', habitId);
    
    const { data, error } = await supabase
      .from('habit_completions')
      .select('completed_date')
      .eq('habit_id', habitId)
      .eq('user_id', userId)
      .order('completed_date', { ascending: false });

    if (error) {
      console.error('Error fetching completion data:', error);
      return 0;
    }

    if (!data || data.length === 0) {
      console.log('No completion data found');
      return 0;
    }

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Sort completion dates
    const completionDates = data.map(d => new Date(d.completed_date + 'T00:00:00')).sort((a, b) => b.getTime() - a.getTime());
    
    console.log('Completion dates for streak calculation:', completionDates);
    
    // Calculate consecutive days from most recent completion
    for (let i = 0; i < completionDates.length; i++) {
      const completionDate = completionDates[i];
      const expectedDate = new Date(today);
      expectedDate.setDate(today.getDate() - i);
      
      if (completionDate.getTime() === expectedDate.getTime()) {
        streak++;
      } else {
        break;
      }
    }

    console.log('Calculated streak:', streak);
    return streak;
  } catch (error) {
    console.error('Error calculating streak:', error);
    return 0;
  }
};

export const checkTodayCompletion = async (habitId: string, userId: string): Promise<boolean> => {
  const today = new Date().toISOString().split('T')[0];
  
  try {
    const { data, error } = await supabase
      .from('habit_completions')
      .select('id')
      .eq('habit_id', habitId)
      .eq('user_id', userId)
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

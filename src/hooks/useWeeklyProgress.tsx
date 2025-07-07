
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const useWeeklyProgress = () => {
  const { user } = useAuth();
  const [weeklyProgress, setWeeklyProgress] = useState(0);

  const calculateWeeklyProgress = async () => {
    if (!user) return;

    try {
      // Get all habits for the user
      const { data: habits, error: habitsError } = await supabase
        .from('habits')
        .select('id')
        .eq('user_id', user.id);

      if (habitsError || !habits || habits.length === 0) {
        setWeeklyProgress(0);
        return;
      }

      // Get the date range for the current week (last 7 days)
      const today = new Date();
      const weekAgo = new Date();
      weekAgo.setDate(today.getDate() - 6); // Last 7 days including today

      const startDate = weekAgo.toISOString().split('T')[0];
      const endDate = today.toISOString().split('T')[0];

      // Get all completions for this week
      const { data: completions, error: completionsError } = await supabase
        .from('habit_completions')
        .select('habit_id, completed_date')
        .eq('user_id', user.id)
        .gte('completed_date', startDate)
        .lte('completed_date', endDate);

      if (completionsError) {
        console.error('Error fetching weekly completions:', completionsError);
        setWeeklyProgress(0);
        return;
      }

      // Calculate total possible completions (habits × 7 days)
      const totalPossibleCompletions = habits.length * 7;
      
      // Calculate actual completions
      const actualCompletions = completions ? completions.length : 0;
      
      // Calculate percentage
      const progress = totalPossibleCompletions > 0 
        ? Math.round((actualCompletions / totalPossibleCompletions) * 100)
        : 0;

      setWeeklyProgress(progress);
    } catch (error) {
      console.error('Error calculating weekly progress:', error);
      setWeeklyProgress(0);
    }
  };

  useEffect(() => {
    if (user) {
      calculateWeeklyProgress();
    }
  }, [user]);

  return { weeklyProgress, calculateWeeklyProgress };
};

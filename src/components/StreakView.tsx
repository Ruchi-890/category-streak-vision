import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Flame, Calendar, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/components/ui/sonner";

interface Habit {
  id: string;
  name: string;
  category: string;
  streak: number;
}

interface StreakViewProps {
  onClose: () => void;
}

const StreakView = ({ onClose }: StreakViewProps) => {
  const { user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);

  const calculateStreakForView = async (habitId: string): Promise<number> => {
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

      return streak;
    } catch (error) {
      console.error('Error calculating streak:', error);
      return 0;
    }
  };

  useEffect(() => {
    if (user) {
      loadHabitsWithStreaks();
    }
  }, [user]);

  const loadHabitsWithStreaks = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('habits')
        .select('id, name, category, streak')
        .eq('user_id', user.id)
        .order('streak', { ascending: false });

      if (error) {
        console.error('Error loading habits:', error);
        toast.error('Failed to load streak data');
        return;
      }

      if (!data || data.length === 0) {
        setHabits([]);
        return;
      }

      // Recalculate streaks to ensure accuracy
      const habitsWithUpdatedStreaks = await Promise.all(
        data.map(async (habit) => {
          const calculatedStreak = await calculateStreakForView(habit.id);
          
          // Update the database if the calculated streak differs from stored value
          if (calculatedStreak !== habit.streak) {
            await supabase
              .from('habits')
              .update({ streak: calculatedStreak })
              .eq('id', habit.id)
              .eq('user_id', user.id);
          }
          
          return {
            ...habit,
            streak: calculatedStreak
          };
        })
      );

      // Sort by streak descending
      habitsWithUpdatedStreaks.sort((a, b) => b.streak - a.streak);
      setHabits(habitsWithUpdatedStreaks);
    } catch (error) {
      console.error('Unexpected error:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getStreakColor = (streak: number) => {
    if (streak >= 30) return "text-purple-600";
    if (streak >= 14) return "text-orange-600";
    if (streak >= 7) return "text-blue-600";
    if (streak >= 3) return "text-green-600";
    return "text-gray-600";
  };

  const getStreakBadge = (streak: number) => {
    if (streak >= 30) return { text: "Champion", variant: "default" as const };
    if (streak >= 14) return { text: "On Fire", variant: "destructive" as const };
    if (streak >= 7) return { text: "Weekly Warrior", variant: "secondary" as const };
    if (streak >= 3) return { text: "Getting Started", variant: "outline" as const };
    return { text: "Just Started", variant: "outline" as const };
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="text-center">Loading streak data...</div>
      </Card>
    );
  }

  const totalDays = habits.reduce((sum, habit) => sum + habit.streak, 0);
  const longestStreak = Math.max(...habits.map(h => h.streak), 0);
  const activeStreaks = habits.filter(h => h.streak > 0).length;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Flame className="text-orange-500" />
          Streak Dashboard
        </h2>
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-red-50 rounded-lg">
          <Trophy className="h-8 w-8 text-orange-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-orange-600">{longestStreak}</div>
          <div className="text-sm text-gray-600">Longest Streak</div>
        </div>
        <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
          <Calendar className="h-8 w-8 text-blue-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-blue-600">{totalDays}</div>
          <div className="text-sm text-gray-600">Total Days</div>
        </div>
        <div className="text-center p-4 bg-gradient-to-br from-green-50 to-teal-50 rounded-lg">
          <Flame className="h-8 w-8 text-green-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-green-600">{activeStreaks}</div>
          <div className="text-sm text-gray-600">Active Streaks</div>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-lg font-semibold mb-4">Habit Streaks</h3>
        {habits.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No habits found. Create some habits to start tracking streaks!
          </div>
        ) : (
          habits.map((habit) => {
            const badge = getStreakBadge(habit.streak);
            return (
              <div
                key={habit.id}
                className="flex items-center justify-between p-4 bg-white border rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex-1">
                  <h4 className="font-medium">{habit.name}</h4>
                  <p className="text-sm text-gray-500">{habit.category}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={badge.variant}>{badge.text}</Badge>
                  <div className="flex items-center gap-1">
                    <Flame className={`h-5 w-5 ${getStreakColor(habit.streak)}`} />
                    <span className={`font-bold text-lg ${getStreakColor(habit.streak)}`}>
                      {habit.streak}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
};

export default StreakView;

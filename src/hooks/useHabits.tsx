
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { loadUserHabits } from "@/services/habitDataLoader";
import { toggleHabitCompletion, deleteHabitFromDb } from "@/services/habitOperations";

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

  const loadHabits = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const loadedHabits = await loadUserHabits(user.id);
    setHabits(loadedHabits);
    setLoading(false);
  };

  const toggleHabit = async (id: string) => {
    const habit = habits.find(h => h.id === id);
    if (!habit || !user) return;

    const result = await toggleHabitCompletion(id, user.id, habit.name, habit.completed);
    
    if (result.success) {
      // Update local state
      setHabits(prevHabits =>
        prevHabits.map(h =>
          h.id === id ? { ...h, completed: true, streak: result.newStreak || h.streak } : h
        )
      );
    }
  };

  const deleteHabit = async (habit: Habit) => {
    if (!user) return;

    const success = await deleteHabitFromDb(habit.id, user.id, habit.name);
    
    if (success) {
      setHabits(prevHabits => prevHabits.filter(h => h.id !== habit.id));
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


import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from "@/components/ui/sonner";

const PRESET_HABITS = [
  { name: "Morning Meditation", category: "Health" },
  { name: "Read 30 mins", category: "Learning" },
  { name: "Exercise", category: "Fitness" },
  { name: "Drink 8 glasses of water", category: "Health" },
  { name: "Write in journal", category: "Personal" },
  { name: "Practice gratitude", category: "Mental Health" },
];

const CATEGORIES = ["Health", "Learning", "Fitness", "Personal", "Mental Health", "Productivity"];

const Setup = () => {
  const [selectedHabits, setSelectedHabits] = useState<Array<{name: string, category: string}>>([]);
  const [customHabit, setCustomHabit] = useState('');
  const [customCategory, setCustomCategory] = useState('Health');
  const navigate = useNavigate();

  const addPresetHabit = (habit: {name: string, category: string}) => {
    if (!selectedHabits.find(h => h.name === habit.name)) {
      setSelectedHabits([...selectedHabits, habit]);
    }
  };

  const addCustomHabit = () => {
    if (customHabit.trim() && !selectedHabits.find(h => h.name === customHabit.trim())) {
      setSelectedHabits([...selectedHabits, { name: customHabit.trim(), category: customCategory }]);
      setCustomHabit('');
    }
  };

  const removeHabit = (habitName: string) => {
    setSelectedHabits(selectedHabits.filter(h => h.name !== habitName));
  };

  const handleFinishSetup = () => {
    if (selectedHabits.length === 0) {
      toast.error('Please select at least one habit to track');
      return;
    }
    
    // For now, we'll store in localStorage until we connect to database
    localStorage.setItem('userHabits', JSON.stringify(selectedHabits.map((habit, index) => ({
      id: index + 1,
      name: habit.name,
      category: habit.category,
      streak: 0,
      completed: false
    }))));
    
    localStorage.setItem('setupCompleted', 'true');
    toast.success('Your habits have been set up successfully!');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Welcome to Habit Tracker!</h1>
          <p className="text-muted-foreground">Let's set up your first habits to track</p>
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Choose from popular habits</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {PRESET_HABITS.map((habit) => (
                <div
                  key={habit.name}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedHabits.find(h => h.name === habit.name)
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => addPresetHabit(habit)}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{habit.name}</span>
                    <Badge variant="secondary">{habit.category}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Add a custom habit</h2>
            <div className="flex gap-3">
              <div className="flex-1">
                <Label htmlFor="customHabit">Habit name</Label>
                <Input
                  id="customHabit"
                  value={customHabit}
                  onChange={(e) => setCustomHabit(e.target.value)}
                  placeholder="e.g., Practice piano"
                  onKeyPress={(e) => e.key === 'Enter' && addCustomHabit()}
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <Button onClick={addCustomHabit} size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {selectedHabits.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Your selected habits ({selectedHabits.length})</h2>
              <div className="space-y-2">
                {selectedHabits.map((habit) => (
                  <div
                    key={habit.name}
                    className="flex items-center justify-between p-3 bg-card border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{habit.name}</span>
                      <Badge variant="outline">{habit.category}</Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeHabit(habit.name)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-center pt-6">
            <Button 
              onClick={handleFinishSetup}
              size="lg"
              disabled={selectedHabits.length === 0}
            >
              Start Tracking ({selectedHabits.length} habits)
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Setup;

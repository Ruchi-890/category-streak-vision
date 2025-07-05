
-- Create a table for storing user habits
CREATE TABLE public.habits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  streak INTEGER DEFAULT 0 NOT NULL,
  completed BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- Create a table for tracking habit completions by date
CREATE TABLE public.habit_completions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  habit_id UUID REFERENCES public.habits(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  completed_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  UNIQUE(habit_id, completed_date)
);

-- Enable Row Level Security
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_completions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for habits table
CREATE POLICY "Users can view their own habits" ON public.habits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own habits" ON public.habits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own habits" ON public.habits
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own habits" ON public.habits
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for habit_completions table
CREATE POLICY "Users can view their own habit completions" ON public.habit_completions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own habit completions" ON public.habit_completions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own habit completions" ON public.habit_completions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own habit completions" ON public.habit_completions
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_habits_user_id ON public.habits(user_id);
CREATE INDEX idx_habit_completions_user_id ON public.habit_completions(user_id);
CREATE INDEX idx_habit_completions_date ON public.habit_completions(completed_date);

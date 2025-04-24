
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from 'react-router-dom';
import { toast } from "@/components/ui/sonner";
import { User, Lock, Mail } from 'lucide-react';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (isLogin) {
        // Login
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          toast.error('Login failed', {
            description: error.message
          });
          return;
        }

        toast.success('Logged in successfully');
        navigate('/');
      } else {
        // Signup
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: username
            }
          }
        });

        if (error) {
          toast.error('Signup failed', {
            description: error.message
          });
          return;
        }

        toast.success('Account created successfully');
        navigate('/');
      }
    } catch (error) {
      console.error('Authentication error:', error);
      toast.error('An unexpected error occurred');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md bg-card p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-center">
          {isLogin ? 'Login' : 'Sign Up'}
        </h2>
        <form onSubmit={handleAuth} className="space-y-4">
          {!isLogin && (
            <div>
              <Label htmlFor="username">
                <User className="inline-block mr-2" /> Username
              </Label>
              <Input 
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required={!isLogin}
                placeholder="Choose a username"
              />
            </div>
          )}
          
          <div>
            <Label htmlFor="email">
              <Mail className="inline-block mr-2" /> Email
            </Label>
            <Input 
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
              placeholder="Enter your email"
            />
          </div>
          
          <div>
            <Label htmlFor="password">
              <Lock className="inline-block mr-2" /> Password
            </Label>
            <Input 
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
              placeholder="Enter your password"
            />
          </div>
          
          <Button type="submit" className="w-full">
            {isLogin ? 'Login' : 'Create Account'}
          </Button>
        </form>
        
        <div className="text-center mt-4">
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-primary hover:underline"
          >
            {isLogin 
              ? 'Need an account? Sign Up' 
              : 'Already have an account? Login'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;

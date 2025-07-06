
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from '@supabase/supabase-js';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up listener for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Initial check for existing session
    const checkSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting session:', error.message);
          // Clear any invalid session data
          await supabase.auth.signOut();
        } else {
          setSession(data.session);
          setUser(data.session?.user ?? null);
        }
      } catch (error) {
        console.error('Unexpected error checking session:', error);
        // Clear any invalid session data
        await supabase.auth.signOut();
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Cleanup subscription
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error during logout:', error.message);
      }
    } catch (error) {
      console.error('Unexpected error during logout:', error);
    }
  };

  return { user, session, loading, logout };
};

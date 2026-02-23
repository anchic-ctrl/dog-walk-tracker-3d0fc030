import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isActiveMember: boolean;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isActiveMember, setIsActiveMember] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const resetMemberState = () => {
      setIsActiveMember(false);
      setIsAdmin(false);
      setIsSuperAdmin(false);
    };

    const loadMemberState = async (userId: string) => {
      try {
        const memberQuery = supabase
          .from('members')
          .select('role, status, is_super_admin')
          .eq('user_id', userId)
          .eq('status', 'active')
          .maybeSingle();

        const timeout = new Promise<never>((_, reject) => {
          window.setTimeout(() => reject(new Error('member lookup timeout')), 8000);
        });

        const { data, error } = await Promise.race([memberQuery, timeout]);
        if (error) throw error;
        if (!isMounted) return;

        if (data) {
          setIsActiveMember(true);
          setIsSuperAdmin(data.is_super_admin);
          setIsAdmin(data.role === 'admin' || data.is_super_admin);
          return;
        }

        resetMemberState();
      } catch {
        if (isMounted) {
          resetMemberState();
        }
      }
    };

    const applySessionState = async (nextSession: Session | null) => {
      if (!isMounted) return;

      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      if (nextSession?.user) {
        await loadMemberState(nextSession.user.id);
      } else {
        resetMemberState();
      }

      if (isMounted) {
        setLoading(false);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      void applySessionState(nextSession);
    });

    void supabase.auth
      .getSession()
      .then(({ data: { session } }) => applySessionState(session))
      .catch(() => {
        if (isMounted) {
          resetMemberState();
          setLoading(false);
        }
      });

    // Safety valve: never leave UI stuck on spinner forever.
    const safetyTimeout = window.setTimeout(() => {
      if (isMounted) {
        setLoading(false);
      }
    }, 10000);

    return () => {
      isMounted = false;
      window.clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, displayName?: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          display_name: displayName,
        },
      },
    });
    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setIsAdmin(false);
    setIsSuperAdmin(false);
    setIsActiveMember(false);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      loading, 
      isAdmin,
      isSuperAdmin,
      isActiveMember,
      signUp, 
      signIn, 
      signOut 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

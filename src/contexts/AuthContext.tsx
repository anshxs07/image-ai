import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface SubscriptionInfo {
  subscribed: boolean;
  subscription_tier?: string;
  subscription_end?: string;
}

interface UsageInfo {
  generation_count: number;
  edit_count: number;
  total_usage: number;
  limit: number;
  remaining: number;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  subscription: SubscriptionInfo;
  usage: UsageInfo;
  loading: boolean;
  checkSubscription: () => Promise<void>;
  trackUsage: (action: 'generate' | 'edit') => Promise<boolean>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionInfo>({ subscribed: false });
  const [usage, setUsage] = useState<UsageInfo>({
    generation_count: 0,
    edit_count: 0,
    total_usage: 0,
    limit: 5,
    remaining: 5
  });
  const [loading, setLoading] = useState(true);

  const checkSubscription = async () => {
    if (!session) return;

    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      if (error) throw error;
      setSubscription(data);
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  const fetchUsage = async () => {
    if (!session) return;

    try {
      // Get current usage from database
      const { data: usageData, error } = await supabase
        .from('usage_tracking')
        .select('*')
        .eq('email', session.user.email)
        .gte('current_period_end', new Date().toISOString())
        .single();

      if (usageData) {
        // Get subscription info to determine limit
        const { data: subData } = await supabase
          .from('subscribers')
          .select('*')
          .eq('email', session.user.email)
          .single();

        let limit = 5; // Free plan default
        if (subData && subData.subscribed) {
          switch (subData.subscription_tier) {
            case "Pro":
              limit = 25;
              break;
            case "Pro Plus":
              limit = 500;
              break;
            default:
              limit = 5;
          }
        }

        setUsage({
          generation_count: usageData.generation_count,
          edit_count: usageData.edit_count,
          total_usage: usageData.total_usage,
          limit,
          remaining: limit - usageData.total_usage
        });
      }
    } catch (error) {
      console.error('Error fetching usage:', error);
    }
  };

  const trackUsage = async (action: 'generate' | 'edit'): Promise<boolean> => {
    if (!session) return false;

    try {
      const { data, error } = await supabase.functions.invoke('track-usage', {
        body: { action }
      });

      if (error) throw error;

      if (data.error) {
        // Usage limit reached
        return false;
      }

      // Update local usage state
      setUsage({
        generation_count: data.usage.generation_count,
        edit_count: data.usage.edit_count,
        total_usage: data.usage.total_usage,
        limit: data.limit,
        remaining: data.remaining
      });

      return true;
    } catch (error) {
      console.error('Error tracking usage:', error);
      return false;
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Defer Supabase calls to prevent deadlock
        if (session?.user) {
          setTimeout(() => {
            checkSubscription();
            fetchUsage();
          }, 0);
        } else {
          setSubscription({ subscribed: false });
          setUsage({
            generation_count: 0,
            edit_count: 0,
            total_usage: 0,
            limit: 5,
            remaining: 5
          });
        }
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        setTimeout(() => {
          checkSubscription();
          fetchUsage();
        }, 0);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const value = {
    user,
    session,
    subscription,
    usage,
    loading,
    checkSubscription,
    trackUsage,
    signOut
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useUser, useAuth as useClerkAuth } from '@clerk/clerk-react';
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
  user: any | null;
  session: any | null;
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
  const { user: clerkUser, isLoaded } = useUser();
  const { getToken, signOut: clerkSignOut } = useClerkAuth();
  const [subscription, setSubscription] = useState<SubscriptionInfo>({ subscribed: false });
  const [usage, setUsage] = useState<UsageInfo>({
    generation_count: 0,
    edit_count: 0,
    total_usage: 0,
    limit: 5,
    remaining: 5
  });
  const [loading, setLoading] = useState(true);

  // Create a session-like object for compatibility
  const session = clerkUser ? {
    user: {
      id: clerkUser.id,
      email: clerkUser.emailAddresses[0]?.emailAddress,
    },
    access_token: null // Will be populated when needed
  } : null;

  const checkSubscription = async () => {
    if (!clerkUser) return;

    try {
      const token = await getToken();
      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (error) throw error;
      setSubscription(data);
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  const fetchUsage = async () => {
    if (!clerkUser) return;

    try {
      const userEmail = clerkUser.emailAddresses[0]?.emailAddress;
      
      // Get current usage from database
      const { data: usageData, error } = await supabase
        .from('usage_tracking')
        .select('*')
        .eq('email', userEmail)
        .gte('current_period_end', new Date().toISOString())
        .single();

      if (usageData) {
        // Get subscription info to determine limit
        const { data: subData } = await supabase
          .from('subscribers')
          .select('*')
          .eq('email', userEmail)
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
    if (!clerkUser) return false;

    try {
      const token = await getToken();
      const { data, error } = await supabase.functions.invoke('track-usage', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
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
    await clerkSignOut();
  };

  useEffect(() => {
    if (isLoaded) {
      if (clerkUser) {
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
  }, [clerkUser, isLoaded]);

  const value = {
    user: clerkUser,
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
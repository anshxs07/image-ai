import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  CreditCard, 
  Calendar, 
  TrendingUp, 
  Settings, 
  RefreshCw,
  Crown,
  Zap,
  Star
} from "lucide-react";
import { format } from "date-fns";

const plans = [
  {
    id: "free",
    name: "Free",
    price: 0,
    period: "forever",
    features: ["5 Image Generations", "5 Image Edits", "Basic Support"],
    limits: { generations: 5, edits: 5 },
    icon: Star,
    color: "text-muted-foreground"
  },
  {
    id: "pro",
    name: "Pro",
    price: 10,
    period: "month",
    features: ["25 Image Generations", "25 Image Edits", "Priority Support", "HD Quality"],
    limits: { generations: 25, edits: 25 },
    priceId: "price_1RtOe1R5hjXkJqtZ6BM47HkI",
    icon: Zap,
    color: "text-blue-500"
  },
  {
    id: "pro-plus",
    name: "Pro Plus",
    price: 50,
    period: "month", 
    features: ["500 Image Generations", "500 Image Edits", "Premium Support", "4K Quality", "API Access"],
    limits: { generations: 500, edits: 500 },
    priceId: "price_1RtOedR5hjXkJqtZNiUKd7bk",
    icon: Crown,
    color: "text-purple-500"
  }
];

export default function PlanManagement() {
  const { user, session, subscription, usage, checkSubscription } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [upgradeLoading, setUpgradeLoading] = useState<string | null>(null);

  const currentPlan = plans.find(plan => {
    if (!subscription?.subscribed) return plan.id === "free";
    const tierMap: Record<string, string> = {
      "Pro": "pro",
      "Pro Plus": "pro-plus"
    };
    return plan.id === tierMap[subscription.subscription_tier || ""];
  }) || plans[0];

  const usagePercentage = usage?.limit ? Math.round((usage.total_usage / usage.limit) * 100) : 0;

  const handleUpgrade = async (priceId: string, planName: string) => {
    if (!user || !session) {
      toast({
        title: "Authentication required",
        description: "Please log in to upgrade your plan.",
        variant: "destructive",
      });
      return;
    }

    setUpgradeLoading(priceId);
    try {
      // Map priceId to plan name that the edge function expects
      const planMap: Record<string, string> = {
        "price_1RtOe1R5hjXkJqtZ6BM47HkI": "pro",
        "price_1RtOedR5hjXkJqtZNiUKd7bk": "proplus"
      };
      
      const planName = planMap[priceId];
      if (!planName) {
        throw new Error("Invalid plan selected");
      }

      const { data, error } = await supabase.functions.invoke('create-checkout', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: { plan: planName },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
        toast({
          title: "Redirecting to checkout",
          description: `Opening Stripe checkout for ${planName} plan.`,
        });
      }
    } catch (error) {
      console.error('Upgrade error:', error);
      toast({
        title: "Upgrade failed",
        description: "There was an error upgrading your plan. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUpgradeLoading(null);
    }
  };

  const handleManageSubscription = async () => {
    if (!user || !session) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
        toast({
          title: "Opening billing portal",
          description: "Redirecting to Stripe customer portal.",
        });
      }
    } catch (error) {
      console.error('Customer portal error:', error);
      toast({
        title: "Error",
        description: "Failed to open billing portal. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setLoading(true);
    try {
      await checkSubscription();
      toast({
        title: "Data refreshed",
        description: "Your subscription data has been updated.",
      });
    } catch (error) {
      toast({
        title: "Refresh failed",
        description: "Failed to refresh data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto py-12 px-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Plan Management</h1>
          <p className="text-muted-foreground mb-8">Please log in to manage your subscription plan.</p>
          <Button onClick={() => window.location.href = '/auth'}>Sign In</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Plan Management</h1>
          <p className="text-muted-foreground">Manage your subscription and monitor usage</p>
        </div>
        <Button onClick={refreshData} disabled={loading} variant="outline" size="sm">
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Current Plan Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Current Plan Card */}
        <Card className="md:col-span-2 lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <currentPlan.icon className={`w-5 h-5 ${currentPlan.color}`} />
              Current Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-2xl font-bold">{currentPlan.name}</h3>
                  {subscription?.subscribed && (
                    <Badge variant="default">Active</Badge>
                  )}
                </div>
                <p className="text-muted-foreground">
                  ${currentPlan.price}/{currentPlan.period}
                </p>
              </div>
              
              {subscription?.subscription_end && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  Next billing: {format(new Date(subscription.subscription_end), "MMM dd, yyyy")}
                </div>
              )}
              
              {subscription?.subscribed && (
                <Button 
                  onClick={handleManageSubscription} 
                  disabled={loading}
                  variant="outline" 
                  size="sm"
                  className="w-full"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Manage Billing
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Usage Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Usage This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Total Usage</span>
                  <span>{usage?.total_usage || 0} / {usage?.limit || 0}</span>
                </div>
                <Progress value={usagePercentage} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  {usagePercentage}% used
                </p>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Generations</span>
                  <span>{usage?.generation_count || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Edits</span>
                  <span>{usage?.edit_count || 0}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Billing Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Billing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {subscription?.subscribed ? (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Status</span>
                    <Badge variant="default">Active</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Plan</span>
                    <span>{subscription.subscription_tier}</span>
                  </div>
                  {subscription.subscription_end && (
                    <div className="flex justify-between text-sm">
                      <span>Renews</span>
                      <span>{format(new Date(subscription.subscription_end), "MMM dd")}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground mb-2">No active subscription</p>
                  <Badge variant="secondary">Free Plan</Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Available Plans */}
      <div>
        <h2 className="text-2xl font-bold mb-6">Available Plans</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => {
            const isCurrentPlan = plan.id === currentPlan.id;
            const IconComponent = plan.icon;
            
            return (
              <Card key={plan.id} className={`relative ${isCurrentPlan ? 'ring-2 ring-primary' : ''}`}>
                {isCurrentPlan && (
                  <Badge className="absolute -top-2 left-4 z-10">Current Plan</Badge>
                )}
                
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <IconComponent className={`w-5 h-5 ${plan.color}`} />
                    {plan.name}
                  </CardTitle>
                  <CardDescription>
                    <span className="text-2xl font-bold">${plan.price}</span>
                    <span className="text-muted-foreground">/{plan.period}</span>
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <ul className="space-y-2 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="text-sm flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  
                  {!isCurrentPlan && plan.priceId && (
                    <Button
                      onClick={() => handleUpgrade(plan.priceId!, plan.name)}
                      disabled={upgradeLoading === plan.priceId}
                      className="w-full"
                    >
                      {upgradeLoading === plan.priceId ? "Processing..." : `Upgrade to ${plan.name}`}
                    </Button>
                  )}
                  
                  {isCurrentPlan && !subscription?.subscribed && (
                    <Button disabled className="w-full" variant="secondary">
                      Current Plan
                    </Button>
                  )}
                  
                  {isCurrentPlan && subscription?.subscribed && (
                    <Button 
                      onClick={handleManageSubscription}
                      disabled={loading}
                      variant="outline" 
                      className="w-full"
                    >
                      Manage Plan
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
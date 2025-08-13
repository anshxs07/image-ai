import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/ClerkAuthContext";
import { Loader2, Crown, Zap, Rocket, ExternalLink } from "lucide-react";

const plans = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "/month",
    limit: 5,
    description: "Perfect for trying out our AI image generation",
    features: [
      "5 image generations per month",
      "5 image edits per month",
      "Basic image quality",
      "Standard support"
    ],
    icon: Zap,
    current: true
  },
  {
    id: "pro",
    name: "Pro",
    price: "$10",
    period: "/month",
    limit: 25,
    description: "Great for regular creators and small projects",
    features: [
      "25 image generations per month",
      "25 image edits per month",
      "High image quality",
      "Priority support",
      "Advanced editing options"
    ],
    icon: Crown,
    popular: true
  },
  {
    id: "proplus",
    name: "Pro Plus",
    price: "$50",
    period: "/month",
    limit: 500,
    description: "Perfect for professionals and businesses",
    features: [
      "500 image generations per month",
      "500 image edits per month",
      "Ultra-high image quality",
      "24/7 priority support",
      "Advanced editing options",
      "Bulk processing"
    ],
    icon: Rocket
  }
];

const SubscriptionManager = () => {
  const [loading, setLoading] = useState<string | null>(null);
  const { user, subscription, usage, checkSubscription } = useAuth();
  const { toast } = useToast();

  const handleUpgrade = async (planId: string) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to upgrade your plan.",
        variant: "destructive",
      });
      return;
    }

    if (planId === "free") return;

    setLoading(planId);

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { plan: planId }
      });

      if (error) throw error;

      // Open Stripe checkout in a new tab
      window.open(data.url, '_blank');
      
      toast({
        title: "Redirecting to Checkout",
        description: "You'll be redirected to Stripe to complete your subscription.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  const handleManageSubscription = async () => {
    if (!user) return;

    setLoading("manage");

    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');

      if (error) throw error;

      // Open customer portal in a new tab
      window.open(data.url, '_blank');
      
      toast({
        title: "Opening Customer Portal",
        description: "You'll be redirected to manage your subscription.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  const getCurrentPlan = () => {
    if (!subscription.subscribed) return "free";
    return subscription.subscription_tier?.toLowerCase().replace(" ", "") || "free";
  };

  const currentPlan = getCurrentPlan();
  const usagePercentage = (usage.total_usage / usage.limit) * 100;

  return (
    <div className="space-y-8">
      {/* Current Usage */}
      {user && (
        <Card>
          <CardHeader>
            <CardTitle>Current Usage</CardTitle>
            <CardDescription>
              Your usage for this billing period
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {usage.total_usage} of {usage.limit} used
              </span>
              <Badge variant={usage.remaining > 0 ? "default" : "destructive"}>
                {usage.remaining} remaining
              </Badge>
            </div>
            <Progress value={usagePercentage} className="w-full" />
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <div className="text-2xl font-bold">{usage.generation_count}</div>
                <div className="text-sm text-muted-foreground">Generations</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{usage.edit_count}</div>
                <div className="text-sm text-muted-foreground">Edits</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Subscription Plans */}
      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const Icon = plan.icon;
          const isCurrentPlan = currentPlan === plan.id;
          const isSubscribed = subscription.subscribed && isCurrentPlan;

          return (
            <Card key={plan.id} className={`relative ${plan.popular ? 'border-primary shadow-lg' : ''} ${isCurrentPlan ? 'ring-2 ring-primary' : ''}`}>
              {plan.popular && (
                <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                  Most Popular
                </Badge>
              )}
              {isCurrentPlan && (
                <Badge variant="secondary" className="absolute -top-2 right-4">
                  Current Plan
                </Badge>
              )}
              
              <CardHeader className="text-center pb-2">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className="text-sm text-muted-foreground">{plan.period}</span>
                </div>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <ul className="space-y-2 text-sm">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
                
                {plan.id === "free" ? (
                  <Button className="w-full" disabled>
                    Current Plan
                  </Button>
                ) : isSubscribed ? (
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    onClick={handleManageSubscription}
                    disabled={loading === "manage"}
                  >
                    {loading === "manage" ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        Manage Subscription
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                ) : (
                  <Button 
                    className="w-full" 
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={loading === plan.id || !user}
                  >
                    {loading === plan.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      `Upgrade to ${plan.name}`
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {subscription.subscribed && (
        <Card>
          <CardHeader>
            <CardTitle>Subscription Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span>Plan:</span>
              <Badge>{subscription.subscription_tier}</Badge>
            </div>
            {subscription.subscription_end && (
              <div className="flex justify-between">
                <span>Next billing date:</span>
                <span>{new Date(subscription.subscription_end).toLocaleDateString()}</span>
              </div>
            )}
            <Button 
              variant="outline" 
              onClick={handleManageSubscription}
              disabled={loading === "manage"}
              className="w-full mt-4"
            >
              {loading === "manage" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  Manage Subscription
                  <ExternalLink className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SubscriptionManager;
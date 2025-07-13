import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Free",
    price: "0",
    description: "Perfect for trying out StyleAI",
    features: [
      "5 transformations per month",
      "Standard resolution (1024x1024)",
      "Basic art styles",
      "Community support"
    ],
    cta: "Get Started",
    variant: "outline" as const
  },
  {
    name: "Pro",
    price: "19",
    description: "For creators and professionals",
    features: [
      "100 transformations per month",
      "High resolution (2048x2048)",
      "All art styles including premium",
      "Priority processing",
      "Email support",
      "Commercial license"
    ],
    cta: "Start Free Trial",
    variant: "hero" as const,
    popular: true
  },
  {
    name: "Studio",
    price: "49",
    description: "For teams and agencies",
    features: [
      "Unlimited transformations",
      "Ultra-high resolution (4096x4096)",
      "Custom style training",
      "Batch processing",
      "API access",
      "Priority support",
      "Team collaboration tools"
    ],
    cta: "Contact Sales",
    variant: "outline" as const
  }
];

export const Pricing = () => {
  return (
    <section id="pricing" className="py-24 relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Simple, Transparent
            <span className="bg-gradient-primary bg-clip-text text-transparent"> Pricing</span>
          </h2>
          <p className="text-xl text-foreground/80 max-w-2xl mx-auto">
            Choose the perfect plan for your creative needs. Start free, upgrade anytime.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <Card 
              key={index} 
              className={`p-8 relative bg-gradient-card border-border/40 hover:border-primary/40 transition-all duration-300 ${
                plan.popular ? 'ring-2 ring-primary/50 scale-105' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-primary text-white px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </div>
                </div>
              )}
              
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-foreground mb-2">{plan.name}</h3>
                <div className="mb-2">
                  <span className="text-4xl font-bold text-foreground">${plan.price}</span>
                  <span className="text-foreground/60">/month</span>
                </div>
                <p className="text-foreground/70">{plan.description}</p>
              </div>
              
              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start">
                    <Check className="h-5 w-5 text-primary mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-foreground/80">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Button variant={plan.variant} className="w-full" size="lg">
                {plan.cta}
              </Button>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
import { Header } from "@/components/landing/Header";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { Pricing } from "@/components/landing/Pricing";
import { Footer } from "@/components/landing/Footer";
import { ImageGenerator } from "@/components/ImageGenerator";
import SubscriptionManager from "@/components/SubscriptionManager";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Hero />
      <ImageGenerator />
      {user && (
        <section id="subscription" className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Manage Your Subscription</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                View your current usage and upgrade your plan to generate more images.
              </p>
            </div>
            <SubscriptionManager />
          </div>
        </section>
      )}
      <Features />
      <Pricing />
      <Footer />
    </div>
  );
};

export default Index;

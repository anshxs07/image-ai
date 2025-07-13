import { Button } from "@/components/ui/button";
import { ArrowRight, Upload } from "lucide-react";
import heroLaptopImage from "@/assets/hero-laptop-comparison.jpg";

export const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-hero" />
      
      {/* Animated grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)] opacity-20" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-4xl mx-auto animate-fade-in">
          {/* Badge */}
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8">
            <span className="mr-2">🎨</span>
            AI-Powered Image Transformation
          </div>
          
          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
            Transform Your Photos Into
            <span className="bg-gradient-primary bg-clip-text text-transparent block mt-2">
              Stunning Art Styles
            </span>
          </h1>
          
          {/* Subheadline */}
          <p className="text-xl text-foreground/80 mb-8 max-w-2xl mx-auto leading-relaxed">
            Upload any image and watch our AI transform it into beautiful Ghibli-style artwork, 
            action figures, or any artistic style you can imagine. No design skills required.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Button variant="hero" size="lg" className="min-w-[200px]">
              <Upload className="mr-2 h-5 w-5" />
              Start Creating
            </Button>
            <Button variant="outline" size="lg" className="min-w-[200px]">
              See Examples
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
          
          {/* Hero Image */}
          <div className="relative max-w-4xl mx-auto">
            <div className="relative rounded-2xl overflow-hidden shadow-card border border-border/40 bg-card backdrop-blur-sm">
              <img 
                src={heroLaptopImage} 
                alt="Woman with laptop transformation from photo to Ghibli anime style" 
                className="w-full h-auto"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent" />
            </div>
            
            {/* Floating cards */}
            <div className="absolute -top-4 -left-4 bg-card border border-border rounded-lg p-3 shadow-card animate-glow-pulse hidden lg:block">
              <div className="text-sm font-medium text-foreground">Real Photo</div>
            </div>
            <div className="absolute -top-4 -right-4 bg-card border border-border rounded-lg p-3 shadow-card animate-glow-pulse hidden lg:block">
              <div className="text-sm font-medium text-foreground">Anime Art</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
import { Card } from "@/components/ui/card";
import { Palette, Zap, Download, Shield } from "lucide-react";

const features = [
  {
    icon: Palette,
    title: "Multiple Art Styles",
    description: "Transform your photos into Ghibli anime, action figures, oil paintings, and dozens of other artistic styles."
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Get your transformed images in seconds, not minutes. Our AI processes images faster than ever before."
  },
  {
    icon: Download,
    title: "High Resolution",
    description: "Download your creations in high resolution, perfect for printing, social media, or professional use."
  },
  {
    icon: Shield,
    title: "Privacy First",
    description: "Your images are processed securely and deleted immediately after transformation. We never store your data."
  }
];

export const Features = () => {
  return (
    <section id="features" className="py-24 relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Powerful Features for
            <span className="bg-gradient-primary bg-clip-text text-transparent"> Creative Freedom</span>
          </h2>
          <p className="text-xl text-foreground/80 max-w-2xl mx-auto">
            Everything you need to transform your photos into stunning artwork with just a few clicks.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="p-6 bg-gradient-card border-border/40 hover:border-primary/40 transition-all duration-300 hover:shadow-card">
              <div className="p-3 rounded-lg bg-primary/10 w-fit mb-4">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">{feature.title}</h3>
              <p className="text-foreground/70 leading-relaxed">{feature.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
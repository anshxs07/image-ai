import { Sparkles } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="py-12 border-t border-border/40 bg-card/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="p-2 rounded-lg bg-gradient-primary">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-foreground">StyleAI</span>
            </div>
            <p className="text-foreground/70 max-w-md">
              Transform your photos into stunning artwork with AI. Create, inspire, and share your unique visual stories.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold text-foreground mb-4">Product</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-foreground/70 hover:text-foreground transition-colors">Features</a></li>
              <li><a href="#" className="text-foreground/70 hover:text-foreground transition-colors">Pricing</a></li>
              <li><a href="#" className="text-foreground/70 hover:text-foreground transition-colors">API</a></li>
              <li><a href="#" className="text-foreground/70 hover:text-foreground transition-colors">Gallery</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-foreground mb-4">Support</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-foreground/70 hover:text-foreground transition-colors">Help Center</a></li>
              <li><a href="#" className="text-foreground/70 hover:text-foreground transition-colors">Contact</a></li>
              <li><a href="#" className="text-foreground/70 hover:text-foreground transition-colors">Privacy</a></li>
              <li><a href="#" className="text-foreground/70 hover:text-foreground transition-colors">Terms</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-border/40 mt-8 pt-8 text-center">
          <p className="text-foreground/60">
            © 2024 StyleAI. All rights reserved. Made with ❤️ for creators.
          </p>
        </div>
      </div>
    </footer>
  );
};
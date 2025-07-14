import { Header } from "@/components/landing/Header";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { Pricing } from "@/components/landing/Pricing";
import { Footer } from "@/components/landing/Footer";
import { ImageGenerator } from "@/components/ImageGenerator";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Hero />
      <ImageGenerator />
      <Features />
      <Pricing />
      <Footer />
    </div>
  );
};

export default Index;

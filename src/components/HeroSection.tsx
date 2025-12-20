import { Button } from "@/components/ui/button";
import { ArrowRight, Leaf, Truck, Shield } from "lucide-react";
import heroBanner from "@/assets/hero-banner.jpg";

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroBanner}
          alt="Fresh vegetables and fruits"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-foreground/90 via-foreground/70 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-20 md:py-32">
        <div className="max-w-2xl">
          <span className="inline-block px-4 py-2 bg-primary/20 text-primary-foreground rounded-full text-sm font-medium mb-6 animate-fade-up backdrop-blur-sm">
            🌿 Fresh & Organic Products
          </span>
          
          <h1 className="text-4xl md:text-6xl font-extrabold text-primary-foreground mb-6 leading-tight animate-fade-up">
            Fresh Groceries
            <br />
            <span className="text-secondary">Delivered Daily</span>
          </h1>
          
          <p className="text-lg text-primary-foreground/80 mb-8 animate-fade-up">
            Get the freshest vegetables, fruits, and groceries delivered to your doorstep. 
            Quality products at the best prices, straight from local farms.
          </p>

          <div className="flex flex-wrap gap-4 mb-12 animate-fade-up">
            <Button variant="accent" size="xl" className="gap-2">
              Shop Now
              <ArrowRight className="w-5 h-5" />
            </Button>
            <Button variant="outline" size="xl" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
              View Categories
            </Button>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fade-up">
            <div className="flex items-center gap-3 bg-primary-foreground/10 backdrop-blur-sm rounded-xl p-4">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                <Leaf className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold text-primary-foreground">100% Organic</p>
                <p className="text-xs text-primary-foreground/70">Fresh products</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 bg-primary-foreground/10 backdrop-blur-sm rounded-xl p-4">
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                <Truck className="w-5 h-5 text-secondary-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold text-primary-foreground">Free Delivery</p>
                <p className="text-xs text-primary-foreground/70">On orders ₹500+</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 bg-primary-foreground/10 backdrop-blur-sm rounded-xl p-4">
              <div className="w-10 h-10 rounded-full bg-success flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold text-primary-foreground">Secure Payment</p>
                <p className="text-xs text-primary-foreground/70">100% protected</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;

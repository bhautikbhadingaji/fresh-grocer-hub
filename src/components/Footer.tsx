import { Heart, Mail, Phone, MapPin, Facebook, Instagram, Twitter } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-foreground text-primary-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <h3 className="text-2xl font-bold mb-4">
              Fresh<span className="text-secondary">Mart</span>
            </h3>
            <p className="text-primary-foreground/70 mb-4">
              Your trusted partner for fresh groceries and daily essentials. 
              Quality products delivered to your doorstep.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-primary-foreground/10 flex items-center justify-center hover:bg-primary transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-primary-foreground/10 flex items-center justify-center hover:bg-primary transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-primary-foreground/10 flex items-center justify-center hover:bg-primary transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-primary-foreground/70 hover:text-primary transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/#products" className="text-primary-foreground/70 hover:text-primary transition-colors">
                  Products
                </Link>
              </li>
              <li>
                <Link to="/#categories" className="text-primary-foreground/70 hover:text-primary transition-colors">
                  Categories
                </Link>
              </li>
              <li>
                <Link to="/admin" className="text-primary-foreground/70 hover:text-primary transition-colors">
                  Admin Panel
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Categories</h4>
            <ul className="space-y-2">
              <li className="text-primary-foreground/70 hover:text-primary transition-colors cursor-pointer">
                🥬 Vegetables
              </li>
              <li className="text-primary-foreground/70 hover:text-primary transition-colors cursor-pointer">
                🍎 Fruits
              </li>
              <li className="text-primary-foreground/70 hover:text-primary transition-colors cursor-pointer">
                🥛 Dairy
              </li>
              <li className="text-primary-foreground/70 hover:text-primary transition-colors cursor-pointer">
                🌾 Grains
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Contact Us</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-primary-foreground/70">
                <MapPin className="w-5 h-5 text-primary" />
                123 Market Street, City
              </li>
              <li className="flex items-center gap-3 text-primary-foreground/70">
                <Phone className="w-5 h-5 text-primary" />
                +91 98765 43210
              </li>
              <li className="flex items-center gap-3 text-primary-foreground/70">
                <Mail className="w-5 h-5 text-primary" />
                hello@freshmart.com
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-primary-foreground/10 mt-8 pt-8 text-center">
         
        </div>
      </div>
    </footer>
  );
};

export default Footer;

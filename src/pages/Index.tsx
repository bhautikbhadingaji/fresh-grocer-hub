import { useState } from "react";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import ProductCard from "@/components/ProductCard";
import CategoryCard from "@/components/CategoryCard";
import Footer from "@/components/Footer";
import { products, categories } from "@/data/mockData";
import { Sparkles } from "lucide-react";

const Index = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredProducts = selectedCategory
    ? products.filter((p) => p.categoryId === selectedCategory)
    : products;

  const getCategoryById = (id: string) => categories.find((c) => c.id === id);
  const getProductCountByCategory = (categoryId: string) =>
    products.filter((p) => p.categoryId === categoryId).length;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <HeroSection />

      {/* Live Poster / Promotional Banner */}
      <section className="bg-gradient-hero py-4">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-3 text-primary-foreground animate-pulse">
            <Sparkles className="w-5 h-5" />
            <p className="text-sm md:text-base font-semibold text-center">
              🎉 Special Offer: Get 20% OFF on all vegetables this week! Use code: FRESH20
            </p>
            <Sparkles className="w-5 h-5" />
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section id="categories" className="py-12 md:py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
              Shop by Category
            </h2>
            <p className="text-muted-foreground">
              Browse our wide selection of fresh products
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-4">
            <CategoryCard
              category={{ id: "all", name: "All", icon: "🛒" }}
              isActive={selectedCategory === null}
              onClick={() => setSelectedCategory(null)}
              productCount={products.length}
            />
            {categories.map((category) => (
              <CategoryCard
                key={category.id}
                category={category}
                isActive={selectedCategory === category.id}
                onClick={() => setSelectedCategory(category.id)}
                productCount={getProductCountByCategory(category.id)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section id="products" className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                {selectedCategory
                  ? `${getCategoryById(selectedCategory)?.icon} ${getCategoryById(selectedCategory)?.name}`
                  : "Featured Products"}
              </h2>
              <p className="text-muted-foreground">
                {filteredProducts.length} products available
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product, index) => (
              <div
                key={product.id}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <ProductCard
                  product={product}
                  category={getCategoryById(product.categoryId)}
                />
              </div>
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">
                No products found in this category.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-12 md:py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              About FreshMart
            </h2>
            <p className="text-muted-foreground text-lg mb-6">
              We are your trusted neighborhood provision store, committed to bringing you the freshest 
              vegetables, fruits, and daily essentials. With a focus on quality and customer satisfaction, 
              we source directly from local farms to ensure you get the best products at competitive prices.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="bg-card rounded-2xl p-6 shadow-sm">
                <p className="text-3xl font-bold text-primary mb-1">500+</p>
                <p className="text-sm text-muted-foreground">Products</p>
              </div>
              <div className="bg-card rounded-2xl p-6 shadow-sm">
                <p className="text-3xl font-bold text-secondary mb-1">1000+</p>
                <p className="text-sm text-muted-foreground">Happy Customers</p>
              </div>
              <div className="bg-card rounded-2xl p-6 shadow-sm">
                <p className="text-3xl font-bold text-primary mb-1">50+</p>
                <p className="text-sm text-muted-foreground">Local Farms</p>
              </div>
              <div className="bg-card rounded-2xl p-6 shadow-sm">
                <p className="text-3xl font-bold text-secondary mb-1">24/7</p>
                <p className="text-sm text-muted-foreground">Support</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;

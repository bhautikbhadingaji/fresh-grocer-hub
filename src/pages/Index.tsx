import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import ProductCard from "@/components/ProductCard";
import CategoryCard from "@/components/CategoryCard";
import Footer from "@/components/Footer";
import { Sparkles } from "lucide-react";
import { Product, Category } from "@/types";
import { cn } from "@/lib/utils"; // cn import ઉમેર્યું

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Index = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    // Fetch Products
    fetch(`${API}/api/products`)
      .then((r) => r.json())
      .then((data) => {
        const mapped = data.map((p: any) => ({ ...p, id: p._id }));
        setProducts(mapped);
      })
      .catch((err) => console.error("Error fetching products:", err));

    // Fetch Categories
    fetch(`${API}/api/categories`)
      .then((r) => r.json())
      .then((data) => {
        const mapped = data.map((c: any) => ({ ...c, id: c._id }));
        setCategories(mapped);
      })
      .catch((err) => console.error("Error fetching categories:", err));
  }, []);

  const filteredProducts = selectedCategory
    ? products.filter((p) => p.categoryId === selectedCategory)
    : products;

  const getCategoryById = (id: string) => categories.find((c) => c.id === id);
  
  const getProductCountByCategory = (categoryId: string) =>
    products.filter((p) => p.categoryId === categoryId).length;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />

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

      <section id="categories" className="py-12 md:py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Shop by Category</h2>
            <p className="text-muted-foreground">Browse our wide selection of fresh products</p>
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

      <section id="products" className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                {selectedCategory
                  ? `${getCategoryById(selectedCategory)?.icon || ''} ${getCategoryById(selectedCategory)?.name || ''}`
                  : "Featured Products"}
              </h2>
              <p className="text-muted-foreground">{filteredProducts.length} products available</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product, index) => (
              <div key={product.id} style={{ animationDelay: `${index * 0.1}s` }}>
                <ProductCard
                  product={product}
                  category={getCategoryById(product.categoryId)}
                />
              </div>
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">No products found.</p>
            </div>
          )}
        </div>
      </section>

      <section id="about" className="py-12 md:py-16 bg-muted/50">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">About FreshMart</h2>
          <p className="text-muted-foreground text-lg mb-6">
            તમારા વિશ્વાસુ પડોશી સ્ટોર, અમે સીધા ફાર્મમાંથી તાજા શાકભાજી લાવીએ છીએ.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
              <p className="text-3xl font-bold mb-1 text-primary">{products.length}+</p>
              <p className="text-sm text-muted-foreground">Products</p>
            </div>
            <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
              <p className="text-3xl font-bold mb-1 text-secondary">1000+</p>
              <p className="text-sm text-muted-foreground">Happy Customers</p>
            </div>
            <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
              <p className="text-3xl font-bold mb-1 text-primary">50+</p>
              <p className="text-sm text-muted-foreground">Local Farms</p>
            </div>
            <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
              <p className="text-3xl font-bold mb-1 text-secondary">24/7</p>
              <p className="text-sm text-muted-foreground">Support</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
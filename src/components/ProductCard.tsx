import { Product, Category } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Package } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
  category?: Category;
}

const ProductCard = ({ product, category }: ProductCardProps) => {
  const getStockStatus = (stock: number) => {
    if (stock <= 5) return { label: "Low Stock", color: "bg-stock-low" };
    if (stock <= 20) return { label: "Limited", color: "bg-stock-medium" };
    return { label: "In Stock", color: "bg-stock-high" };
  };

  const stockStatus = getStockStatus(product.stock);

  return (
    <div className="group bg-card rounded-2xl border border-border overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-fade-up">
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-muted">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400';
          }}
        />
        
        {/* Category Badge */}
        {category && (
          <div className="absolute top-3 left-3">
            <Badge variant="secondary" className="bg-card/90 backdrop-blur-sm text-foreground font-medium shadow-sm">
              {category.icon} {category.name}
            </Badge>
          </div>
        )}

        {/* Stock Badge */}
        <div className="absolute top-3 right-3">
          <div className={cn(
            "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-primary-foreground",
            stockStatus.color
          )}>
            <Package className="w-3 h-3" />
            {stockStatus.label}
          </div>
        </div>

        {/* Quick Add Overlay */}
        <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
          <Button variant="hero" size="sm" className="gap-2 shadow-xl">
            <ShoppingCart className="w-4 h-4" />
            Add to Cart
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-foreground text-lg mb-1 line-clamp-1 group-hover:text-primary transition-colors">
          {product.name}
        </h3>
        <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
          {product.description}
        </p>
        
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-primary">₹{product.price}</span>
            <span className="text-sm text-muted-foreground">/{product.unit}</span>
          </div>
          <div className="text-xs text-muted-foreground">
            {product.stock} {product.unit} left
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;

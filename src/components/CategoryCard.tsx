import { Category } from "@/types";
import { cn } from "@/lib/utils";

interface CategoryCardProps {
  category: Category;
  isActive?: boolean;
  onClick?: () => void;
  productCount?: number;
}

const CategoryCard = ({ category, isActive, onClick, productCount = 0 }: CategoryCardProps) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-300 min-w-[100px] hover:scale-105",
        isActive
          ? "border-primary bg-primary/10 shadow-glow"
          : "border-border bg-card hover:border-primary/50 hover:bg-muted"
      )}
    >
      <span className="text-3xl">{category.icon}</span>
      <span className={cn(
        "text-sm font-medium",
        isActive ? "text-primary" : "text-foreground"
      )}>
        {category.name}
      </span>
      {productCount > 0 && (
        <span className="text-xs text-muted-foreground">
          {productCount} items
        </span>
      )}
    </button>
  );
};

export default CategoryCard;

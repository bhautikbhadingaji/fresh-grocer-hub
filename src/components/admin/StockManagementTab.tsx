import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Save, RotateCcw } from "lucide-react";
import { Product, Category } from "@/types";

interface StockManagementTabProps {
  products: Product[];
  categories: Category[];
  tempStocks: { [key: string]: number };
  onTempStockChange: (stocks: { [key: string]: number }) => void;
  onUpdateStock: (productId: string, newStock: number) => void;
}

export const StockManagementTab = ({ 
  products, 
  categories, 
  tempStocks,
  onTempStockChange,
  onUpdateStock 
}: StockManagementTabProps) => {
  const [stockSearch, setStockSearch] = useState("");

  const updateTempStock = (productId: string, value: number) => {
    onTempStockChange({ ...tempStocks, [productId]: value });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold">Stock Management</h2>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search product stock..." 
            className="pl-9" 
            value={stockSearch} 
            onChange={(e) => setStockSearch(e.target.value)}
          />
        </div>
      </div>

      {categories.map((category) => {
        const categoryProducts = products.filter(p => 
          p.categoryId === category.id && 
          p.name.toLowerCase().includes(stockSearch.toLowerCase())
        );
        
        if (categoryProducts.length === 0) return null;

        return (
          <div key={category.id} className="space-y-4">
            <div className="flex items-center gap-2 border-b border-primary/20 pb-2">
              <span className="text-2xl">{category.icon}</span>
              <h3 className="text-xl font-bold text-primary">{category.name}</h3>
            </div>

            <div className="grid gap-4">
              {categoryProducts.map((p) => {
                const currentTempStock = tempStocks[p.id] ?? p.stock;
                const hasChanged = currentTempStock !== p.stock;

                return (
                  <div 
                    key={p.id} 
                    className="bg-card rounded-xl border p-4 flex flex-wrap items-center gap-4"
                  >
                    <img src={p.image} className="w-14 h-14 rounded-lg object-cover" />
                    
                    <div className="flex-1 min-w-[150px]">
                      <h4 className="font-semibold">{p.name}</h4>
                      <p className="text-xs">Current: {p.stock} {p.unit}</p>
                    </div>
                    
                    <div className="flex items-center justify-end gap-3 min-w-[340px]">
                      <div className="w-[100px] flex justify-end">
                        {hasChanged && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-destructive whitespace-nowrap px-2" 
                            onClick={() => updateTempStock(p.id, p.stock)}
                          >
                            <RotateCcw className="w-4 h-4 mr-1" /> Cancel
                          </Button>
                        )}
                      </div>

                      <div className="flex items-center gap-2 bg-muted rounded-lg p-1.5 px-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8" 
                          onClick={() => updateTempStock(p.id, Math.max(0, currentTempStock - 1))}
                        >
                          -
                        </Button>
                        <Input 
                          type="number" 
                          step="any" 
                          className="w-16 h-8 text-center bg-transparent border-none font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                          value={currentTempStock} 
                          onChange={(e) => updateTempStock(p.id, parseFloat(e.target.value) || 0)} 
                        />
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8" 
                          onClick={() => updateTempStock(p.id, currentTempStock + 1)}
                        >
                          +
                        </Button>
                      </div>

                      <Button 
                        size="sm" 
                        variant={hasChanged ? "hero" : "outline"} 
                        disabled={!hasChanged} 
                        onClick={() => onUpdateStock(p.id, currentTempStock)} 
                        className="gap-2 min-w-[90px]"
                      >
                        <Save className="w-4 h-4" /> Save
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { Category } from "@/types";
import { CategoryFormData } from "@/types/admin";
import { categorySchema, getBorderClass } from "@/utils/validation";
import { cn } from "@/lib/utils";

interface CategoriesTabProps {
  categories: Category[];
  onCreateCategory: (payload: any) => Promise<any>;
  onUpdateCategory: (id: string, payload: any) => Promise<any>;
  onDeleteCategory: (id: string) => void;
}

export const CategoriesTab = ({ 
  categories, 
  onCreateCategory, 
  onUpdateCategory, 
  onDeleteCategory 
}: CategoriesTabProps) => {
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categorySearch, setCategorySearch] = useState("");
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  const [categoryForm, setCategoryForm] = useState<CategoryFormData>({ 
    name: "", 
    icon: "📦" 
  });

  const resetCategoryForm = () => {
    setCategoryForm({ name: "", icon: "📦" });
    setEditingCategory(null);
    setFormErrors({});
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    if (!editingCategory) {
      const isDuplicate = categories.some(c => 
        c.name.toLowerCase().trim() === categoryForm.name.toLowerCase().trim()
      );
      if (isDuplicate) { 
        setFormErrors({ name: "This category name already exists." }); 
        return; 
      }
    }

    try {
      await categorySchema.validate(categoryForm, { abortEarly: false });

      if (editingCategory) {
        await onUpdateCategory(editingCategory.id, categoryForm);
      } else {
        await onCreateCategory(categoryForm);
      }

      setIsCategoryDialogOpen(false);
      resetCategoryForm();
    } catch (err: any) {
      const errors: any = {};
      err.inner?.forEach((e: any) => { if (e.path) errors[e.path] = e.message; });
      setFormErrors(errors);
    }
  };

  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(categorySearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold">Categories</h2>
        <div className="flex w-full sm:w-auto gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search categories..." 
              className="pl-9" 
              value={categorySearch} 
              onChange={(e) => setCategorySearch(e.target.value)}
            />
          </div>
          <Button 
            variant="hero" 
            onClick={() => { resetCategoryForm(); setIsCategoryDialogOpen(true); }}
          >
            <Plus className="mr-2 h-4 w-4" /> Add Category
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCategories.map((cat) => (
          <div 
            key={cat.id} 
            className="bg-card rounded-xl border p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl">{cat.icon}</span>
              <span className="font-semibold">{cat.name}</span>
            </div>
            <div className="flex gap-1">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => {
                  setEditingCategory(cat);
                  setCategoryForm({ name: cat.name, icon: cat.icon });
                  setIsCategoryDialogOpen(true);
                }}
              >
                <Pencil className="w-4 h-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-destructive" 
                onClick={() => onDeleteCategory(cat.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
        {filteredCategories.length === 0 && (
          <div className="col-span-full p-8 text-center text-muted-foreground bg-card border rounded-xl">
            No categories found.
          </div>
        )}
      </div>

      {/* Category Dialog */}
      <Dialog 
        open={isCategoryDialogOpen} 
        onOpenChange={(open) => { 
          setIsCategoryDialogOpen(open); 
          if(!open) resetCategoryForm(); 
        }}
      >
        <DialogContent className="bg-card">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Edit Category" : "Add New Category"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCategorySubmit} className="space-y-4 pt-2">
            <div className="space-y-1">
              <Label>Name</Label>
              <Input 
                className={getBorderClass("name", categoryForm.name, formErrors)} 
                value={categoryForm.name} 
                onChange={e => { 
                  setCategoryForm({...categoryForm, name: e.target.value}); 
                  setFormErrors(prev => {const n = {...prev}; delete n.name; return n;}); 
                }} 
              />
              {formErrors.name && (
                <p className="text-xs text-destructive font-medium">{formErrors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Icon</Label>
              <div className="flex flex-wrap gap-2">
                {["📦", "🥬", "🍎", "🥛", "🌾", "🌶️", "🪵", "🥩", "🍞"].map(emoji => (
                  <button 
                    key={emoji} 
                    type="button" 
                    onClick={() => setCategoryForm({...categoryForm, icon: emoji})} 
                    className={cn(
                      "w-10 h-10 rounded border transition-all", 
                      categoryForm.icon === emoji 
                        ? "border-primary bg-primary/10 scale-110 shadow-sm" 
                        : "border-border hover:bg-muted"
                    )}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <Button type="submit" className="w-full" variant="hero">
              Save Category
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
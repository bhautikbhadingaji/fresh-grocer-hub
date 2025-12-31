import * as Yup from "yup";

export const productSchema = Yup.object().shape({
  name: Yup.string().trim().required("Product name is required").min(1, "Name cannot be empty"),
  description: Yup.string().trim().required("Description is required").min(1, "Description cannot be empty"),
  price: Yup.number()
    .typeError("Price must be a valid number")
    .min(1, "Price must be at least 1")
    .required("Price is required"),
  stock: Yup.number()
    .typeError("Stock must be a valid number")
    .min(0, "Stock cannot be negative")
    .required("Stock level is required"),
  categoryId: Yup.string().required("Please select a category"),
  image: Yup.string().optional(),
  unit: Yup.string().required("Unit measurement is required"),
});

export const categorySchema = Yup.object().shape({
  name: Yup.string().trim().required("Category name is required").min(1, "Name cannot be empty"),
  icon: Yup.string().required("Category icon is required"),
});

export const getBorderClass = (fieldName: string, value: any, formErrors: { [key: string]: string }) => {
  if (formErrors[fieldName]) return "border-destructive focus-visible:ring-destructive border-2";
  if (fieldName === "price" && value !== "" && Number(value) < 1) return "border-destructive border-2";
  if ((fieldName === "name" || fieldName === "description") && value !== "" && value.trim() === "") return "border-destructive border-2";
  if (value && String(value).trim() !== "") return "border-green-500 focus-visible:ring-green-500 border-2";
  return "";
};

export const handleKeyRestriction = (e: React.KeyboardEvent<HTMLInputElement>) => {
  const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter', '.'];
  if (!/[0-9]/.test(e.key) && !allowedKeys.includes(e.key)) {
    e.preventDefault();
  }
};
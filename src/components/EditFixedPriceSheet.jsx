import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useUpdateProduct } from "../hooks/useProducts";
import { useUpdateInventoryItem } from "../hooks/useInventory";
import { toast } from "sonner";
import { Card, CardContent } from "./ui/card";

const fixedPriceFormSchema = z.object({
  price: z.coerce.number().min(0, "Price must be at least 0"),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
});

export const EditFixedPriceSheet = ({ product, inventory, open, onOpenChange, onSuccess }) => {
  const updateProduct = useUpdateProduct();
  const updateInventory = useUpdateInventoryItem();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(fixedPriceFormSchema),
    defaultValues: {
      price: 0,
      quantity: 0,
    },
  });

  // Update form when product/inventory changes and sheet opens
  useEffect(() => {
    if (product && inventory && open) {
      reset({
        price: product.price,
        quantity: inventory.quantity,
      });
    }
  }, [product, inventory, open, reset]);

  // Reset form when sheet closes
  useEffect(() => {
    if (!open) {
      reset({
        price: 0,
        quantity: 0,
      });
    }
  }, [open, reset]);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      // Update both product price and inventory quantity in parallel
      await Promise.all([
        updateProduct.mutateAsync({
          productId: product.productId,
          data: { 
            title: product.title,
            description: product.description,
            price: data.price,
            categoryId: product.category?.categoryId
          },
        }),
        updateInventory.mutateAsync({
          productId: product.productId,
          quantity: data.quantity,
        }),
      ]);

      toast.success("Product updated successfully");
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Failed to update product:", error);
      toast.error(error.response?.data?.message || "Failed to update product");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!product || !inventory) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-[440px]">
        <SheetHeader>
          <SheetTitle>Edit Fixed Price Listing</SheetTitle>
          <SheetDescription>
            Update the price and quantity below
          </SheetDescription>
        </SheetHeader>

        {/* Product Card */}
        <Card className="mt-4 border-2">
          <CardContent className="flex items-center gap-3 p-4">
            {product.images?.[0]?.imageUri && (
              <img
                src={product.images[0].imageUri}
                alt={product.title}
                className="h-16 w-16 rounded object-cover"
              />
            )}
            <div className="flex-1">
              <h4 className="font-semibold">{product.title}</h4>
              <p className="text-sm text-muted-foreground line-clamp-1">
                {product.description}
              </p>
            </div>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-6">
          {/* Price */}
          <div className="space-y-2">
            <Label htmlFor="price">
              Price <span className="text-destructive">*</span>
            </Label>
            <Controller
              name="price"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  id="price"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                />
              )}
            />
            {errors.price && (
              <p className="text-sm text-destructive">{errors.price.message}</p>
            )}
          </div>

          {/* Quantity */}
          <div className="space-y-2">
            <Label htmlFor="quantity">
              Quantity <span className="text-destructive">*</span>
            </Label>
            <Controller
              name="quantity"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  id="quantity"
                  type="number"
                  placeholder="1"
                />
              )}
            />
            {errors.quantity && (
              <p className="text-sm text-destructive">
                {errors.quantity.message}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? "Updating..." : "Update Listing"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
};

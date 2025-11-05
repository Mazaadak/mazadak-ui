import React from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { Input } from "../ui/input";
import { CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { DollarSign, Package2, Sparkles, ArrowRight } from "lucide-react";

const fixedPriceFormSchema = z.object({
  price: z.coerce.number().min(0.01, "Price must be greater than 0"),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
});

const CreateFixedPriceForm = ({ onSubmit }) => {
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = useForm({
    resolver: zodResolver(fixedPriceFormSchema),
    defaultValues: {
      price: "",
      quantity: 1,
    },
    mode: "onChange",
  });

  const price = watch("price");
  const quantity = watch("quantity");
  const totalValue = (Number(price) || 0) * (Number(quantity) || 0);

  return (
    <CardContent className="p-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Price Input */}
        <div className="space-y-2">
          <label className="text-sm font-semibold flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-green-500/10">
              <DollarSign className="h-4 w-4 text-green-600" />
            </div>
            Price per Item
          </label>
          <Controller
            name="price"
            control={control}
            render={({ field }) => (
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </div>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className={`pl-7 h-12 text-lg ${errors.price ? 'border-red-500 focus-visible:ring-red-500' : 'border-border'}`}
                  {...field}
                />
              </div>
            )}
          />
          {errors.price && (
            <p className="text-sm text-red-600 flex items-center gap-1 animate-in slide-in-from-top-1 duration-200">
              <span className="inline-block w-1 h-1 rounded-full bg-red-600" />
              {errors.price.message}
            </p>
          )}
        </div>

        {/* Quantity Input */}
        <div className="space-y-2">
          <label className="text-sm font-semibold flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-blue-500/10">
              <Package2 className="h-4 w-4 text-blue-600" />
            </div>
            Available Quantity
          </label>
          <Controller
            name="quantity"
            control={control}
            render={({ field }) => (
              <Input
                type="number"
                min="1"
                placeholder="1"
                className={`h-12 text-lg ${errors.quantity ? 'border-red-500 focus-visible:ring-red-500' : 'border-border'}`}
                {...field}
              />
            )}
          />
          {errors.quantity && (
            <p className="text-sm text-red-600 flex items-center gap-1 animate-in slide-in-from-top-1 duration-200">
              <span className="inline-block w-1 h-1 rounded-full bg-red-600" />
              {errors.quantity.message}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Number of items available for sale
          </p>
        </div>

        {/* Total Value Display */}
        {totalValue > 0 && (
          <div className="p-4 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-muted-foreground">Total Inventory Value</span>
              </div>
              <span className="text-2xl font-bold text-primary">
                ${totalValue.toFixed(2)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Based on {quantity || 0} item{quantity > 1 ? 's' : ''} at ${Number(price || 0).toFixed(2)} each
            </p>
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={!isValid}
          className="w-full h-12 text-base font-semibold group transition-all duration-300 hover:shadow-lg"
        >
          Create Fixed Price Listing
          <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </Button>
      </form>
    </CardContent>
  );
};

export default CreateFixedPriceForm;
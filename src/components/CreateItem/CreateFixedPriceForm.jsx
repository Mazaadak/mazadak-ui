import React from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { Input } from "../ui/input";
import { CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";

const fixedPriceFormSchema = z.object({
  price: z.coerce.number().min(0, "Price must be at least 0"),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
});

const CreateFixedPriceForm = ({ onSubmit }) => {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(fixedPriceFormSchema),
    defaultValues: {
      price: 0,
      quantity: 1,
    },
  });

  return (
    <div>
      <CardContent>
        <CardHeader>
          <CardTitle className="text-lg font-medium mb-4">Fixed Price Listing Details</CardTitle>
          <CardDescription>Please provide the price and quantity for your fixed price listing.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="font-medium">Price</label>
            <Controller name="price" control={control} render={({ field }) => <Input type="number" placeholder="Enter price" {...field} />} />
            {errors.price && <p className="text-sm text-red-600">{errors.price.message}</p>}
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-medium">Quantity</label>
            <Controller name="quantity" control={control} render={({ field }) => <Input type="number" placeholder="Enter quantity" {...field} />} />
            {errors.quantity && <p className="text-sm text-red-600">{errors.quantity.message}</p>}
          </div>
          <Button type="submit" className="w-full mt-4">
            Create Fixed Price Listing
          </Button>
        </form>
      </CardContent>
    </div>
  );
};

export default CreateFixedPriceForm;
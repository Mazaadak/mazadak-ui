import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
import { ChevronDownIcon, Package } from "lucide-react";
import { useUpdateAuction } from "../hooks/useAuctions";
import { useProduct } from "../hooks/useProducts";
import { toast } from "sonner";
import { Card, CardContent } from "./ui/card";

const auctionFormSchema = z
  .object({
    title: z.string().min(1, "Title is required"),
    startingPrice: z.coerce.number().min(0, "Starting price must be at least 0"),
    reservePrice: z.coerce.number().min(0, "Reserve price must be at least 0"),
    bidIncrement: z.coerce.number().min(1, "Bid increment must be at least 1"),
    startDate: z.date({ required_error: "Start date is required" }),
    startTime: z.string().min(1, "Start time is required"),
    endDate: z.date({ required_error: "End date is required" }),
    endTime: z.string().min(1, "End time is required"),
  })
  .refine(
    (data) => {
      const startDateTime = new Date(data.startDate);
      const [hours, minutes] = data.startTime.split(":");
      startDateTime.setHours(parseInt(hours), parseInt(minutes));
      return startDateTime > new Date();
    },
    {
      message: "Start time must be in the future",
      path: ["startTime"],
    }
  )
  .refine(
    (data) => {
      const startDateTime = new Date(data.startDate);
      const [startHours, startMinutes] = data.startTime.split(":");
      startDateTime.setHours(parseInt(startHours), parseInt(startMinutes));

      const endDateTime = new Date(data.endDate);
      const [endHours, endMinutes] = data.endTime.split(":");
      endDateTime.setHours(parseInt(endHours), parseInt(endMinutes));

      return endDateTime > startDateTime;
    },
    {
      message: "End time must be after start time",
      path: ["endTime"],
    }
  );

export const EditAuctionSheet = ({ auction, open, onOpenChange, onSuccess }) => {
  const updateAuction = useUpdateAuction();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Fetch product data using productId from auction
  const { data: product } = useProduct(auction?.productId);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm({
    resolver: zodResolver(auctionFormSchema),
    defaultValues: {
      title: "",
      startingPrice: 0,
      reservePrice: 0,
      bidIncrement: 1,
      startDate: new Date(),
      startTime: "",
      endDate: new Date(),
      endTime: "",
    },
  });

  // Update form when auction changes
  useEffect(() => {
    if (auction && open) {
      const startDateTime = new Date(auction.startTime);
      const endDateTime = new Date(auction.endTime);

      reset({
        title: auction.title,
        startingPrice: auction.startingPrice,
        reservePrice: auction.reservePrice || 0,
        bidIncrement: auction.bidIncrement,
        startDate: startDateTime,
        startTime: startDateTime.toTimeString().slice(0, 5),
        endDate: endDateTime,
        endTime: endDateTime.toTimeString().slice(0, 5),
      });
    }
  }, [auction, open, reset]);

  // Reset form when sheet closes
  useEffect(() => {
    if (!open) {
      reset({
        title: "",
        startingPrice: 0,
        reservePrice: 0,
        bidIncrement: 1,
        startDate: new Date(),
        startTime: "",
        endDate: new Date(),
        endTime: "",
      });
    }
  }, [open, reset]);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const startDateTime = new Date(data.startDate);
      const [startHours, startMinutes] = data.startTime.split(":");
      startDateTime.setHours(parseInt(startHours), parseInt(startMinutes));

      const endDateTime = new Date(data.endDate);
      const [endHours, endMinutes] = data.endTime.split(":");
      endDateTime.setHours(parseInt(endHours), parseInt(endMinutes));

      const updateData = {
        productId: auction.productId,
        title: data.title,
        startingPrice: data.startingPrice,
        reservePrice: data.reservePrice || null,
        bidIncrement: data.bidIncrement,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
      };

      await updateAuction.mutateAsync({
        auctionId: auction.id,
        data: updateData,
      });

      toast.success("Auction updated successfully");
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Failed to update auction:", error);
      toast.error(error.response?.data?.message || "Failed to update auction");
    } finally {
      setIsSubmitting(false);
    }
  };

  const startDate = watch("startDate");
  const endDate = watch("endDate");

  if (!auction) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-[540px]">
        <SheetHeader>
          <SheetTitle>Edit Auction</SheetTitle>
          <SheetDescription>
            Update the auction details below
          </SheetDescription>
        </SheetHeader>

        {/* Product Card */}
        {product ? (
          <Card className="mt-4 border-2">
            <CardContent className="flex items-center gap-3 p-4">
              {product.images?.[0]?.imageUri ? (
                <img
                  src={product.images[0].imageUri}
                  alt={product.title}
                  className="h-16 w-16 rounded object-cover"
                />
              ) : (
                <div className="h-16 w-16 rounded bg-muted flex items-center justify-center">
                  <Package className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1">
                <h4 className="font-semibold">{product.title}</h4>
                <p className="text-sm text-muted-foreground line-clamp-1">
                  {product.description}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="mt-4 border-2">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="h-16 w-16 rounded bg-muted flex items-center justify-center animate-pulse">
                <Package className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <div className="h-4 bg-muted rounded w-3/4 mb-2 animate-pulse"></div>
                <div className="h-3 bg-muted rounded w-1/2 animate-pulse"></div>
              </div>
            </CardContent>
          </Card>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Auction Title <span className="text-destructive">*</span>
            </Label>
            <Controller
              name="title"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  id="title"
                  placeholder="Enter auction title"
                />
              )}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          {/* Pricing */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="startingPrice">
                Starting Price <span className="text-destructive">*</span>
              </Label>
              <Controller
                name="startingPrice"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="startingPrice"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                  />
                )}
              />
              {errors.startingPrice && (
                <p className="text-sm text-destructive">
                  {errors.startingPrice.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="reservePrice">Reserve Price</Label>
              <Controller
                name="reservePrice"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="reservePrice"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                  />
                )}
              />
              {errors.reservePrice && (
                <p className="text-sm text-destructive">
                  {errors.reservePrice.message}
                </p>
              )}
            </div>
          </div>

          {/* Bid Increment */}
          <div className="space-y-2">
            <Label htmlFor="bidIncrement">
              Bid Increment <span className="text-destructive">*</span>
            </Label>
            <Controller
              name="bidIncrement"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  id="bidIncrement"
                  type="number"
                  step="0.01"
                  placeholder="1.00"
                />
              )}
            />
            {errors.bidIncrement && (
              <p className="text-sm text-destructive">
                {errors.bidIncrement.message}
              </p>
            )}
          </div>

          {/* Start Date & Time */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Start Date & Time</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="startDate">
                  Start Date <span className="text-destructive">*</span>
                </Label>
                <Controller
                  name="startDate"
                  control={control}
                  render={({ field }) => (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <span>
                            {field.value
                              ? field.value.toLocaleDateString()
                              : "Pick a date"}
                          </span>
                          <ChevronDownIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date(new Date().setHours(0, 0, 0, 0))
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  )}
                />
                {errors.startDate && (
                  <p className="text-sm text-destructive">
                    {errors.startDate.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="startTime">
                  Start Time <span className="text-destructive">*</span>
                </Label>
                <Controller
                  name="startTime"
                  control={control}
                  render={({ field }) => (
                    <Input {...field} id="startTime" type="time" />
                  )}
                />
                {errors.startTime && (
                  <p className="text-sm text-destructive">
                    {errors.startTime.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* End Date & Time */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">End Date & Time</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="endDate">
                  End Date <span className="text-destructive">*</span>
                </Label>
                <Controller
                  name="endDate"
                  control={control}
                  render={({ field }) => (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <span>
                            {field.value
                              ? field.value.toLocaleDateString()
                              : "Pick a date"}
                          </span>
                          <ChevronDownIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date(new Date().setHours(0, 0, 0, 0))
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  )}
                />
                {errors.endDate && (
                  <p className="text-sm text-destructive">
                    {errors.endDate.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="endTime">
                  End Time <span className="text-destructive">*</span>
                </Label>
                <Controller
                  name="endTime"
                  control={control}
                  render={({ field }) => (
                    <Input {...field} id="endTime" type="time" />
                  )}
                />
                {errors.endTime && (
                  <p className="text-sm text-destructive">
                    {errors.endTime.message}
                  </p>
                )}
              </div>
            </div>
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
              {isSubmitting ? "Updating..." : "Update Auction"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
};

import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CardContent } from "@/components/ui/card";
import { ChevronDownIcon, CalendarDays, Clock, DollarSign, TrendingUp, Gavel, AlertCircle, ArrowRight, Sparkles } from "lucide-react";

const auctionFormSchema = z
  .object({
    title: z.string().min(1, "Title is required"),
    startingPrice: z.coerce.number().min(0, "Starting price must be at least 0"),
    reservePrice: z.coerce.number().optional().nullable(),
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

const DateTimePicker = ({ date, onDateChange, time, onTimeChange, label, error, disabled }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      <Label className="px-1">{label}</Label>
      <div className="grid grid-cols-2 gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className={`justify-between font-normal ${error ? "border-destructive" : ""}`} type="button">
              {date ? date.toLocaleDateString() : "Pick a date"}
              <ChevronDownIcon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto overflow-hidden p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(selectedDate) => {
                onDateChange(selectedDate);
                setOpen(false);
              }}
              className="rounded-md border shadow-sm"
              captionLayout="dropdown"
            />
          </PopoverContent>
        </Popover>

        <Input type="time" value={time} onChange={(e) => onTimeChange(e.target.value)} className={`bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none ${error ? "border-destructive" : ""}`} />
      </div>
      {error && <p className="text-sm text-destructive px-1">{error}</p>}
    </div>
  );
};

const CreateAuctionForm = ({ onSubmit, initialData }) => {
  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    watch,
  } = useForm({
    resolver: zodResolver(auctionFormSchema),
    defaultValues: {
      title: initialData?.title || "",
      startingPrice: initialData?.startingPrice || "",
      reservePrice: initialData?.reservePrice || "",
      bidIncrement: initialData?.bidIncrement || "",
      startDate: undefined,
      startTime: "",
      endDate: undefined,
      endTime: "",
    },
    mode: "onChange",
  });

  const startingPrice = watch("startingPrice");
  const reservePrice = watch("reservePrice");

  const formatDateTimeForJava = (date, time) => {
    if (!date || !time) return null;
    
    const dateTime = new Date(date);
    const [hours, minutes] = time.split(':');
    dateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    // This gives us "2025-10-24T20:11:00.000Z" and we remove the milliseconds and Z
    return dateTime.toISOString().split('.')[0];
  };

  const onSubmitForm = (data) => {
    const startDateTime = formatDateTimeForJava(data.startDate, data.startTime);
    const endDateTime = formatDateTimeForJava(data.endDate, data.endTime);

    const submissionData = {
      title: data.title,
      startingPrice: data.startingPrice,
      reservePrice: data.reservePrice || null, // Send null if not filled
      bidIncrement: data.bidIncrement,
      startDateTime: startDateTime,
      endDateTime: endDateTime,
    };

    console.log("Form submitted:", submissionData);
    onSubmit(submissionData);
  };

  // Handler for date changes that also triggers validation
  const handleDateChange = (field, value) => {
    setValue(field, value, { shouldValidate: true });
  };

  // Handler for time changes that also triggers validation
  const handleTimeChange = (field, value) => {
    setValue(field, value, { shouldValidate: true });
  };

  return (
    <CardContent className="p-6">
      <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6">
        {/* Title */}
        <div className="space-y-2">
          <label className="text-sm font-semibold flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-purple-500/10">
              <Gavel className="h-4 w-4 text-purple-600" />
            </div>
            Auction Title
          </label>
          <Controller
            name="title"
            control={control}
            render={({ field }) => (
              <Input
                placeholder="e.g., Vintage Camera Collection"
                className={`h-11 ${errors.title ? 'border-red-500' : ''}`}
                {...field}
              />
            )}
          />
          {errors.title && (
            <p className="text-sm text-red-600 flex items-center gap-1 animate-in slide-in-from-top-1">
              <span className="inline-block w-1 h-1 rounded-full bg-red-600" />
              {errors.title.message}
            </p>
          )}
        </div>

        {/* Pricing Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Starting Price */}
          <div className="space-y-2">
            <label className="text-sm font-semibold flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-green-500/10">
                <DollarSign className="h-4 w-4 text-green-600" />
              </div>
              Starting Price
            </label>
            <Controller
              name="startingPrice"
              control={control}
              render={({ field }) => (
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className={`pl-7 h-11 ${errors.startingPrice ? 'border-red-500' : ''}`}
                    {...field}
                  />
                </div>
              )}
            />
            {errors.startingPrice && (
              <p className="text-xs text-red-600">{errors.startingPrice.message}</p>
            )}
            <p className="text-xs text-muted-foreground">Minimum bid amount</p>
          </div>

          {/* Reserve Price */}
          <div className="space-y-2">
            <label className="text-sm font-semibold flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-orange-500/10">
                <TrendingUp className="h-4 w-4 text-orange-600" />
              </div>
              Reserve Price <span className="text-xs font-normal text-muted-foreground">(Optional)</span>
            </label>
            <Controller
              name="reservePrice"
              control={control}
              render={({ field }) => (
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className={`pl-7 h-11 ${errors.reservePrice ? 'border-red-500' : ''}`}
                    {...field}
                  />
                </div>
              )}
            />
            {errors.reservePrice && (
              <p className="text-xs text-red-600">{errors.reservePrice.message}</p>
            )}
            <p className="text-xs text-muted-foreground">Hidden minimum price</p>
          </div>

          {/* Bid Increment */}
          <div className="space-y-2">
            <label className="text-sm font-semibold flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-blue-500/10">
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </div>
              Bid Increment
            </label>
            <Controller
              name="bidIncrement"
              control={control}
              render={({ field }) => (
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="1.00"
                    className={`pl-7 h-11 ${errors.bidIncrement ? 'border-red-500' : ''}`}
                    {...field}
                  />
                </div>
              )}
            />
            {errors.bidIncrement && (
              <p className="text-xs text-red-600">{errors.bidIncrement.message}</p>
            )}
            <p className="text-xs text-muted-foreground">Minimum bid increase</p>
          </div>
        </div>

        {/* Price Summary */}
        {(startingPrice || reservePrice) && (
          <div className="p-4 rounded-lg bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium">Auction Summary</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {startingPrice && (
                <div>
                  <span className="text-muted-foreground">Starting: </span>
                  <span className="font-semibold">${Number(startingPrice).toFixed(2)}</span>
                </div>
              )}
              {reservePrice && (
                <div>
                  <span className="text-muted-foreground">Reserve: </span>
                  <span className="font-semibold">${Number(reservePrice).toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Start Date & Time */}
        <div className="space-y-2">
          <label className="text-sm font-semibold flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-green-500/10">
              <CalendarDays className="h-4 w-4 text-green-600" />
            </div>
            Start Date & Time
          </label>
          <div className="grid grid-cols-2 gap-3">
            <Controller
              name="startDate"
              control={control}
              render={({ field }) => (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={`justify-between h-11 ${errors.startDate ? 'border-red-500' : ''}`}
                      type="button"
                    >
                      {field.value ? field.value.toLocaleDateString() : "Pick date"}
                      <CalendarDays className="h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={(date) => handleDateChange("startDate", date)}
                      disabled={(date) => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const compareDate = new Date(date);
                        compareDate.setHours(0, 0, 0, 0);
                        return compareDate < today;
                      }}
                    />
                  </PopoverContent>
                </Popover>
              )}
            />
            <Controller
              name="startTime"
              control={control}
              render={({ field }) => (
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    type="time"
                    {...field}
                    className={`pl-10 h-11 [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none ${errors.startTime ? 'border-red-500' : ''}`}
                    onChange={(e) => handleTimeChange("startTime", e.target.value)}
                  />
                </div>
              )}
            />
          </div>
          {(errors.startDate || errors.startTime) && (
            <p className="text-sm text-red-600 flex items-center gap-1 animate-in slide-in-from-top-1">
              <AlertCircle className="h-3 w-3" />
              {errors.startDate?.message || errors.startTime?.message}
            </p>
          )}
        </div>

        {/* End Date & Time */}
        <div className="space-y-2">
          <label className="text-sm font-semibold flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-red-500/10">
              <CalendarDays className="h-4 w-4 text-red-600" />
            </div>
            End Date & Time
          </label>
          <div className="grid grid-cols-2 gap-3">
            <Controller
              name="endDate"
              control={control}
              render={({ field }) => (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={`justify-between h-11 ${errors.endDate ? 'border-red-500' : ''}`}
                      type="button"
                    >
                      {field.value ? field.value.toLocaleDateString() : "Pick date"}
                      <CalendarDays className="h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={(date) => handleDateChange("endDate", date)}
                      disabled={(date) => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const compareDate = new Date(date);
                        compareDate.setHours(0, 0, 0, 0);
                        return compareDate < today;
                      }}
                    />
                  </PopoverContent>
                </Popover>
              )}
            />
            <Controller
              name="endTime"
              control={control}
              render={({ field }) => (
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    type="time"
                    {...field}
                    className={`pl-10 h-11 [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none ${errors.endTime ? 'border-red-500' : ''}`}
                    onChange={(e) => handleTimeChange("endTime", e.target.value)}
                  />
                </div>
              )}
            />
          </div>
          {(errors.endDate || errors.endTime) && (
            <p className="text-sm text-red-600 flex items-center gap-1 animate-in slide-in-from-top-1">
              <AlertCircle className="h-3 w-3" />
              {errors.endDate?.message || errors.endTime?.message}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={!isValid}
          className="w-full h-12 text-base font-semibold group transition-all duration-300 hover:shadow-lg"
        >
          <Gavel className="mr-2 h-4 w-4" />
          Create Auction Listing
          <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </Button>
      </form>
    </CardContent>
  );
};

export default CreateAuctionForm;

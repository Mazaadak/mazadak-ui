import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDownIcon } from "lucide-react";

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
    formState: { errors },
    setValue,
    trigger,
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
  });

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
      reservePrice: data.reservePrice,
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
    <div className="bg-background p-6">
      <div className="max-w-2xl mx-auto">
        <div className="border rounded-lg bg-card text-card-foreground shadow-sm">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold">Auction Listing Details</CardTitle>
            <CardDescription>Please provide the details for your auction listing.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmitForm)} className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <Label htmlFor="title" className="px-1">
                  Title
                </Label>
                <Controller name="title" control={control} render={({ field }) => <Input id="title" placeholder="Enter auction title" {...field} className={errors.title ? "border-destructive" : ""} />} />
                {errors.title && <p className="text-sm text-destructive px-1">{errors.title.message}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="startingPrice" className="px-1">
                    Starting Price ($)
                  </Label>
                  <Controller name="startingPrice" control={control} render={({ field }) => <Input id="startingPrice" type="number" step="0.01" placeholder="0.00" {...field} className={errors.startingPrice ? "border-destructive" : ""} />} />
                  {errors.startingPrice && <p className="text-sm text-destructive px-1">{errors.startingPrice.message}</p>}
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="reservePrice" className="px-1">
                    Reserve Price ($)
                  </Label>
                  <Controller name="reservePrice" control={control} render={({ field }) => <Input id="reservePrice" type="number" step="0.01" placeholder="0.00" {...field} className={errors.reservePrice ? "border-destructive" : ""} />} />
                  {errors.reservePrice && <p className="text-sm text-destructive px-1">{errors.reservePrice.message}</p>}
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="bidIncrement" className="px-1">
                    Bid Increment ($)
                  </Label>
                  <Controller name="bidIncrement" control={control} render={({ field }) => <Input id="bidIncrement" type="number" placeholder="1" {...field} className={errors.bidIncrement ? "border-destructive" : ""} />} />
                  {errors.bidIncrement && <p className="text-sm text-destructive px-1">{errors.bidIncrement.message}</p>}
                </div>
              </div>

              {/* Start Date & Time */}
              <div className="flex flex-col gap-2">
                <Label className="px-1">Start Date & Time</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Controller
                    name="startDate"
                    control={control}
                    render={({ field }) => (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className={`justify-between font-normal ${errors.startDate ? "border-destructive" : ""}`} type="button">
                            {field.value ? field.value.toLocaleDateString() : "Pick a date"}
                            <ChevronDownIcon className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={field.value} onSelect={(date) => handleDateChange("startDate", date)} className="rounded-md border" />
                        </PopoverContent>
                      </Popover>
                    )}
                  />
                  <Controller name="startTime" control={control} render={({ field }) => <Input type="time" {...field} className={`bg-background ${errors.startTime ? "border-destructive" : ""}`} onChange={(e) => handleTimeChange("startTime", e.target.value)} />} />
                </div>
                {(errors.startDate || errors.startTime) && <p className="text-sm text-destructive px-1">{errors.startDate?.message || errors.startTime?.message}</p>}
              </div>

              {/* End Date & Time */}
              <div className="flex flex-col gap-2">
                <Label className="px-1">End Date & Time</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Controller
                    name="endDate"
                    control={control}
                    render={({ field }) => (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className={`justify-between font-normal ${errors.endDate ? "border-destructive" : ""}`} type="button">
                            {field.value ? field.value.toLocaleDateString() : "Pick a date"}
                            <ChevronDownIcon className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={field.value} onSelect={(date) => handleDateChange("endDate", date)} className="rounded-md border" />
                        </PopoverContent>
                      </Popover>
                    )}
                  />
                  <Controller name="endTime" control={control} render={({ field }) => <Input type="time" {...field} className={`bg-background ${errors.endTime ? "border-destructive" : ""}`} onChange={(e) => handleTimeChange("endTime", e.target.value)} />} />
                </div>
                {(errors.endDate || errors.endTime) && <p className="text-sm text-destructive px-1">{errors.endDate?.message || errors.endTime?.message}</p>}
              </div>

              <Button type="submit" className="w-full mt-4">
                Create Auction Listing
              </Button>
            </form>
          </CardContent>
        </div>
      </div>
    </div>
  );
};

export default CreateAuctionForm;

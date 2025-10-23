import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar as CalendarIcon, Clock } from "lucide-react";

const auctionFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  startingPrice: z.coerce.number().min(0, "Starting price must be at least 0"),
  reservePrice: z.coerce.number().min(0, "Reserve price must be at least 0"),
  bidIncrement: z.coerce.number().min(1, "Bid increment must be at least 1"),
  startDate: z.date({ required_error: "Start date is required" }),
  startTime: z.string().min(1, "Start time is required"),
  endDate: z.date({ required_error: "End date is required" }),
  endTime: z.string().min(1, "End time is required"),
}).refine((data) => {
  const startDateTime = new Date(data.startDate);
  const [hours, minutes] = data.startTime.split(":");
  startDateTime.setHours(parseInt(hours), parseInt(minutes));
  return startDateTime > new Date();
}, {
  message: "Start time must be in the future",
  path: ["startTime"],
}).refine((data) => {
  const endDateTime = new Date(data.endDate);
  const [hours, minutes] = data.endTime.split(":");
  endDateTime.setHours(parseInt(hours), parseInt(minutes));
  return endDateTime > new Date();
}, {
  message: "End time must be in the future",
  path: ["endTime"],
}).refine((data) => {
  const startDateTime = new Date(data.startDate);
  const [startHours, startMinutes] = data.startTime.split(":");
  startDateTime.setHours(parseInt(startHours), parseInt(startMinutes));
  
  const endDateTime = new Date(data.endDate);
  const [endHours, endMinutes] = data.endTime.split(":");
  endDateTime.setHours(parseInt(endHours), parseInt(endMinutes));
  
  return endDateTime > startDateTime;
}, {
  message: "End time must be after start time",
  path: ["endTime"],
});

const TimePickerPopover = ({ value, onChange, error }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempHour, setTempHour] = useState(value ? value.split(":")[0] : "12");
  const [tempMinute, setTempMinute] = useState(value ? value.split(":")[1] : "00");

  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"));
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, "0"));

  const handleApply = () => {
    onChange(`${tempHour}:${tempMinute}`);
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={`justify-start text-left font-normal ${error ? "border-red-500" : ""}`}
        >
          <Clock className="mr-2 h-4 w-4" />
          {value || "Pick a time"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <div className="p-4">
          <div className="flex gap-2 mb-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Hour</label>
              <div className="border rounded-md max-h-48 overflow-y-auto">
                {hours.map((hour) => (
                  <button
                    key={hour}
                    type="button"
                    onClick={() => setTempHour(hour)}
                    className={`w-full px-3 py-2 text-left hover:bg-accent ${
                      tempHour === hour ? "bg-accent" : ""
                    }`}
                  >
                    {hour}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Minute</label>
              <div className="border rounded-md max-h-48 overflow-y-auto">
                {minutes.map((minute) => (
                  <button
                    key={minute}
                    type="button"
                    onClick={() => setTempMinute(minute)}
                    className={`w-full px-3 py-2 text-left hover:bg-accent ${
                      tempMinute === minute ? "bg-accent" : ""
                    }`}
                  >
                    {minute}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <Button onClick={handleApply} className="w-full">
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

const CreateAuctionForm = () => {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(auctionFormSchema),
    defaultValues: {
      title: "",
      startingPrice: "",
      reservePrice: "",
      bidIncrement: "",
      startDate: undefined,
      startTime: "",
      endDate: undefined,
      endTime: "",
    },
  });

  const onSubmit = (data) => {
    const startDateTime = new Date(data.startDate);
    const [startHours, startMinutes] = data.startTime.split(":");
    startDateTime.setHours(parseInt(startHours), parseInt(startMinutes));

    const endDateTime = new Date(data.endDate);
    const [endHours, endMinutes] = data.endTime.split(":");
    endDateTime.setHours(parseInt(endHours), parseInt(endMinutes));

    const submissionData = {
      title: data.title,
      startingPrice: data.startingPrice,
      reservePrice: data.reservePrice,
      bidIncrement: data.bidIncrement,
      startDateTime: startDateTime.toISOString(),
      endDateTime: endDateTime.toISOString(),
    };

    console.log("Form submitted:", submissionData);
    alert("Auction created successfully!");
  };

  const formatDate = (date) => {
    if (!date) return "Pick a date";
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto">
        <div className="border rounded-lg bg-card text-card-foreground shadow-sm">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold">Auction Listing Details</CardTitle>
            <CardDescription>Please provide the details for your auction listing.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label className="font-medium text-sm">Title</label>
                <Controller
                  name="title"
                  control={control}
                  render={({ field }) => (
                    <Input
                      placeholder="Enter auction title"
                      {...field}
                      className={errors.title ? "border-red-500" : ""}
                    />
                  )}
                />
                {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="font-medium text-sm">Starting Price ($)</label>
                  <Controller
                    name="startingPrice"
                    control={control}
                    render={({ field }) => (
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        className={errors.startingPrice ? "border-red-500" : ""}
                      />
                    )}
                  />
                  {errors.startingPrice && <p className="text-sm text-destructive">{errors.startingPrice.message}</p>}
                </div>

                <div className="flex flex-col gap-2">
                  <label className="font-medium text-sm">Reserve Price ($)</label>
                  <Controller
                    name="reservePrice"
                    control={control}
                    render={({ field }) => (
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        className={errors.reservePrice ? "border-red-500" : ""}
                      />
                    )}
                  />
                  {errors.reservePrice && <p className="text-sm text-destructive">{errors.reservePrice.message}</p>}
                </div>

                <div className="flex flex-col gap-2">
                  <label className="font-medium text-sm">Bid Increment ($)</label>
                  <Controller
                    name="bidIncrement"
                    control={control}
                    render={({ field }) => (
                      <Input
                        type="number"
                        placeholder="1"
                        {...field}
                        className={errors.bidIncrement ? "border-red-500" : ""}
                      />
                    )}
                  />
                  {errors.bidIncrement && <p className="text-sm text-destructive">{errors.bidIncrement.message}</p>}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-medium text-sm">Start Date & Time</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Controller
                    name="startDate"
                    control={control}
                    render={({ field }) => (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={`justify-start text-left font-normal ${
                              errors.startDate ? "border-red-500" : ""
                            }`}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formatDate(field.value)}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    )}
                  />
                  <Controller
                    name="startTime"
                    control={control}
                    render={({ field }) => (
                      <TimePickerPopover
                        value={field.value}
                        onChange={field.onChange}
                        error={errors.startTime}
                      />
                    )}
                  />
                </div>
                {(errors.startDate || errors.startTime) && (
                  <p className="text-sm text-destructive">
                    {errors.startDate?.message || errors.startTime?.message}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-medium text-sm">End Date & Time</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Controller
                    name="endDate"
                    control={control}
                    render={({ field }) => (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={`justify-start text-left font-normal ${
                              errors.endDate ? "border-red-500" : ""
                            }`}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formatDate(field.value)}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    )}
                  />
                  <Controller
                    name="endTime"
                    control={control}
                    render={({ field }) => (
                      <TimePickerPopover
                        value={field.value}
                        onChange={field.onChange}
                        error={errors.endTime}
                      />
                    )}
                  />
                </div>
                {(errors.endDate || errors.endTime) && (
                  <p className="text-sm text-destructive">
                    {errors.endDate?.message || errors.endTime?.message}
                  </p>
                )}
              </div>

              <Button onClick={handleSubmit(onSubmit)} className="w-full mt-4">
                Create Auction Listing
              </Button>
            </div>
          </CardContent>
        </div>
      </div>
    </div>
  );
};

export default CreateAuctionForm;
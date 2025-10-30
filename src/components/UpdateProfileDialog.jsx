import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useUpdateUser } from '../hooks/useUsers';
import { useAuth } from '../contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from './ui/field';

const profileSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  birthDate: z.date().optional().nullable(),
}).refine(
  (data) => {
    // Allow update if firstName AND lastName are both provided, or if birthDate is provided
    const hasName = (data.firstName && data.firstName.trim()) || (data.lastName && data.lastName.trim());
    const hasBirthDate = data.birthDate !== null && data.birthDate !== undefined;
    return hasName || hasBirthDate;
  },
  {
    message: "Please provide either name fields or birth date to update",
    path: ["firstName"],
  }
);

export const UpdateProfileDialog = ({ open, onOpenChange }) => {
  const { user, refreshUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [birthDate, setBirthDate] = useState(null);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      birthDate: user?.birthDate ? new Date(user.birthDate) : null,
    },
  });

  const updateUserMutation = useUpdateUser();

  // Initialize birthDate from user data
  useEffect(() => {
    if (user?.birthDate) {
      const date = new Date(user.birthDate);
      setBirthDate(date);
      setValue('birthDate', date);
    }
  }, [user?.birthDate, setValue]);

  const onSubmit = async (data) => {
    if (!user?.userId) {
      console.error('No user ID available');
      return;
    }
    
    console.log('Submitting profile update:', { userId: user.userId, data });
    setIsSubmitting(true);
    
    try {
      const updateData = {};
      
      // Only include firstName if provided and not empty
      if (data.firstName && data.firstName.trim()) {
        updateData.firstName = data.firstName.trim();
      }
      
      // Only include lastName if provided and not empty
      if (data.lastName && data.lastName.trim()) {
        updateData.lastName = data.lastName.trim();
      }
      
      // Only include birthDate if it's been set
      if (birthDate) {
        updateData.birthDate = birthDate.toISOString();
      }
      
      // Check if there's actually something to update
      if (Object.keys(updateData).length === 0) {
        console.warn('No fields to update');
        setIsSubmitting(false);
        return;
      }
      
      await updateUserMutation.mutateAsync({
        userId: user.userId,
        updateData,
      });
      
      console.log('Profile update successful');
      
      // Refresh user context if available
      if (refreshUser) {
        await refreshUser();
      }
      
      onOpenChange(false);
      reset();
    } catch (error) {
      console.error('Error updating profile:', error);
      console.error('Error details:', error.response?.data);
      console.error('Error status:', error.response?.status);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen) => {
    if (!newOpen) {
      reset();
      setBirthDate(user?.birthDate ? new Date(user.birthDate) : null);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Update Profile</DialogTitle>
          <DialogDescription>
            Update your name and/or birthdate. You can update them separately or together.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field>
            <FieldLabel>First Name (Optional)</FieldLabel>
            <FieldGroup>
              <Input
                {...register('firstName')}
                type="text"
                placeholder="Enter your first name"
                className={errors.firstName ? 'border-red-500' : ''}
              />
            </FieldGroup>
            {errors.firstName && (
              <FieldError>{errors.firstName.message}</FieldError>
            )}
          </Field>

          <Field>
            <FieldLabel>Last Name (Optional)</FieldLabel>
            <FieldGroup>
              <Input
                {...register('lastName')}
                type="text"
                placeholder="Enter your last name"
                className={errors.lastName ? 'border-red-500' : ''}
              />
            </FieldGroup>
            {errors.lastName && (
              <FieldError>{errors.lastName.message}</FieldError>
            )}
          </Field>

          <Field>
            <FieldLabel>Birth Date (Optional)</FieldLabel>
            <FieldGroup>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !birthDate && "text-muted-foreground"
                    )}
                    type="button"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {birthDate ? format(birthDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={birthDate}
                    onSelect={(date) => {
                      setBirthDate(date);
                      setValue('birthDate', date);
                    }}
                    disabled={(date) =>
                      date > new Date() || date < new Date("1900-01-01")
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </FieldGroup>
            {errors.birthDate && (
              <FieldError>{errors.birthDate.message}</FieldError>
            )}
            <FieldDescription>
              Your date of birth helps us personalize your experience.
            </FieldDescription>
          </Field>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || updateUserMutation.isPending}
            >
              {isSubmitting || updateUserMutation.isPending ? 'Updating...' : 'Update Profile'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

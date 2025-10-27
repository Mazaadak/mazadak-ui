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

const birthdateSchema = z.object({
  birthDate: z.date({
    required_error: "Please select a birth date",
  }),
});

export const UpdateBirthdateDialog = ({ open, onOpenChange }) => {
  const { user, refreshUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [birthDate, setBirthDate] = useState(null);
  
  const {
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm({
    resolver: zodResolver(birthdateSchema),
    defaultValues: {
      birthDate: user?.birthDate ? new Date(user.birthDate) : null,
    },
  });

  const updateUserMutation = useUpdateUser();

  // Initialize birthDate from user data
  useEffect(() => {
    if (open && user?.birthDate) {
      const date = new Date(user.birthDate);
      setBirthDate(date);
      setValue('birthDate', date);
    } else if (open && !user?.birthDate) {
      setBirthDate(null);
      setValue('birthDate', null);
    }
  }, [open, user?.birthDate, setValue]);

  const onSubmit = async (data) => {
    if (!user?.userId) {
      console.error('No user ID available');
      return;
    }
    
    if (!birthDate) {
      console.error('No birth date selected');
      return;
    }
    
    console.log('Submitting birthdate update:', { userId: user.userId, birthDate });
    setIsSubmitting(true);
    
    try {
      await updateUserMutation.mutateAsync({
        userId: user.userId,
        updateData: {
          birthDate: birthDate.toISOString(),
        },
      });
      
      console.log('Birthdate update successful');
      
      // Refresh user context if available
      if (refreshUser) {
        await refreshUser();
      }
      
      onOpenChange(false);
      reset();
    } catch (error) {
      console.error('Error updating birthdate:', error);
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
          <DialogTitle>Update Birth Date</DialogTitle>
          <DialogDescription>
            Select your date of birth below.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field>
            <FieldLabel>Birth Date</FieldLabel>
            <FieldGroup>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !birthDate && "text-muted-foreground",
                      errors.birthDate && "border-red-500"
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
              disabled={isSubmitting || updateUserMutation.isPending || !birthDate}
            >
              {isSubmitting || updateUserMutation.isPending ? 'Updating...' : 'Update Birth Date'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

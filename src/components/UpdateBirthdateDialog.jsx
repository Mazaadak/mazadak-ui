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
import { CalendarIcon, Loader2, CheckCircle } from 'lucide-react';
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
  }).refine((date) => {
    const age = new Date().getFullYear() - date.getFullYear();
    return age >= 13 && age <= 120;
  }, "You must be at least 13 years old"),
});

export const UpdateBirthdateDialog = ({ open, onOpenChange }) => {
  const { user, refreshUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [birthDate, setBirthDate] = useState(null);
  
  const {
    handleSubmit,
    formState: { errors, isDirty },
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
    if (open) {
      if (user?.birthDate) {
        const date = new Date(user.birthDate);
        setBirthDate(date);
        setValue('birthDate', date, { shouldDirty: false });
      } else {
        setBirthDate(null);
        setValue('birthDate', null, { shouldDirty: false });
      }
      setShowSuccess(false);
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
    
    setIsSubmitting(true);
    
    try {
      await updateUserMutation.mutateAsync({
        userId: user.userId,
        updateData: {
          birthDate: birthDate.toISOString(),
        },
      });
      
      // Show success state
      setShowSuccess(true);
      
      // Refresh user context
      if (refreshUser) {
        await refreshUser();
      }
      
      // Close dialog after short delay
      setTimeout(() => {
        onOpenChange(false);
        setShowSuccess(false);
      }, 1500);
    } catch (error) {
      console.error('Error updating birthdate:', error);
      setIsSubmitting(false);
    }
  };

  const handleDateSelect = (date) => {
    setBirthDate(date);
    setValue('birthDate', date, { shouldDirty: true });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Update Birth Date</DialogTitle>
          <DialogDescription className="text-base">
            Select your date of birth. You must be at least 13 years old.
          </DialogDescription>
        </DialogHeader>
        
        {showSuccess ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="relative mb-4">
              <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl animate-pulse" />
              <CheckCircle className="relative h-16 w-16 text-green-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Birth Date Updated!</h3>
            <p className="text-muted-foreground">Your changes have been saved successfully.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
            <FieldGroup>
              <FieldLabel htmlFor="birthDate">Date of Birth</FieldLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="birthDate"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal text-base h-11",
                      !birthDate && "text-muted-foreground"
                    )}
                    disabled={isSubmitting}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {birthDate ? format(birthDate, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={birthDate}
                    onSelect={handleDateSelect}
                    disabled={(date) =>
                      date > new Date() || date < new Date("1900-01-01")
                    }
                    initialFocus
                    captionLayout="dropdown-buttons"
                    fromYear={1924}
                    toYear={new Date().getFullYear()}
                  />
                </PopoverContent>
              </Popover>
              {errors.birthDate && (
                <FieldError>{errors.birthDate.message}</FieldError>
              )}
              <FieldDescription>
                Your birth date will not be publicly displayed.
              </FieldDescription>
            </FieldGroup>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || !birthDate || !isDirty}
                className="min-w-[100px]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

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
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from './ui/field';
import { Loader2, CheckCircle } from 'lucide-react';

const nameSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50, 'First name is too long'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name is too long'),
});

export const UpdateNameDialog = ({ open, onOpenChange }) => {
  const { user, refreshUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Parse current name into firstName and lastName
  const parseName = (fullName) => {
    if (!fullName) return { firstName: '', lastName: '' };
    const parts = fullName.trim().split(' ');
    if (parts.length === 1) return { firstName: parts[0], lastName: '' };
    const firstName = parts[0];
    const lastName = parts.slice(1).join(' ');
    return { firstName, lastName };
  };

  const { firstName: currentFirstName, lastName: currentLastName } = parseName(user?.name);
  
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm({
    resolver: zodResolver(nameSchema),
    defaultValues: {
      firstName: currentFirstName,
      lastName: currentLastName,
    },
  });

  // Reset form when dialog opens or user changes
  useEffect(() => {
    if (open) {
      const { firstName, lastName } = parseName(user?.name);
      reset({ firstName, lastName });
      setShowSuccess(false);
    }
  }, [open, user?.name, reset]);

  const updateUserMutation = useUpdateUser();

  const onSubmit = async (data) => {
    if (!user?.userId) {
      console.error('No user ID available');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await updateUserMutation.mutateAsync({
        userId: user.userId,
        updateData: {
          firstName: data.firstName.trim(),
          lastName: data.lastName.trim(),
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
      console.error('Error updating name:', error);
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Update Your Name</DialogTitle>
          <DialogDescription className="text-base">
            Change your first and last name. This will be displayed on your profile.
          </DialogDescription>
        </DialogHeader>
        
        {showSuccess ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="relative mb-4">
              <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl animate-pulse" />
              <CheckCircle className="relative h-16 w-16 text-green-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Name Updated!</h3>
            <p className="text-muted-foreground">Your changes have been saved successfully.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
            <FieldGroup>
              <FieldLabel htmlFor="firstName">First Name</FieldLabel>
              <Input
                id="firstName"
                {...register('firstName')}
                disabled={isSubmitting}
                placeholder="Enter your first name"
                className="text-base"
                autoFocus
              />
              {errors.firstName && (
                <FieldError>{errors.firstName.message}</FieldError>
              )}
            </FieldGroup>

            <FieldGroup>
              <FieldLabel htmlFor="lastName">Last Name</FieldLabel>
              <Input
                id="lastName"
                {...register('lastName')}
                disabled={isSubmitting}
                placeholder="Enter your last name"
                className="text-base"
              />
              {errors.lastName && (
                <FieldError>{errors.lastName.message}</FieldError>
              )}
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
                disabled={isSubmitting || !isDirty}
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

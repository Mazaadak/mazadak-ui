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
import { Label } from './ui/label';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from './ui/field';

const emailSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export const UpdateEmailDialog = ({ open, onOpenChange }) => {
  const { user, refreshUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: user?.email || '',
    },
  });

  // Update form when dialog opens
  useEffect(() => {
    if (open && user?.email) {
      setValue('email', user.email);
    }
  }, [open, user?.email, setValue]);

  const updateUserMutation = useUpdateUser();

  const onSubmit = async (data) => {
    if (!user?.userId) {
      console.error('No user ID available');
      return;
    }
    
    console.log('Submitting email update:', { userId: user.userId, email: data.email });
    setIsSubmitting(true);
    
    try {
      await updateUserMutation.mutateAsync({
        userId: user.userId,
        updateData: { email: data.email },
      });
      console.log('Email update successful');
      
      // Refresh user context if available
      if (refreshUser) {
        await refreshUser();
      }
      
      onOpenChange(false);
      reset();
    } catch (error) {
      console.error('Error updating email:', error);
      console.error('Error details:', error.response?.data);
      console.error('Error status:', error.response?.status);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (open) => {
    if (!open) {
      reset({ email: user?.email || '' });
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Update Email Address</DialogTitle>
          <DialogDescription>
            Enter your new email address below.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field>
            <FieldLabel>Email Address</FieldLabel>
            <FieldGroup>
              <Input
                {...register('email')}
                type="email"
                placeholder="Enter your email address"
                className={errors.email ? 'border-red-500' : ''}
              />
            </FieldGroup>
            {errors.email && (
              <FieldError>{errors.email.message}</FieldError>
            )}
            <FieldDescription>
              We'll use this email to send you important updates.
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
              {isSubmitting || updateUserMutation.isPending ? 'Updating...' : 'Update Email'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

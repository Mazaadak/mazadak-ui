import { useState } from 'react';
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

const nameSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
});

export const UpdateNameDialog = ({ open, onOpenChange }) => {
  const { user, refreshUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(nameSchema),
    defaultValues: {
      firstName: currentFirstName,
      lastName: currentLastName,
    },
  });

  const updateUserMutation = useUpdateUser();

  const onSubmit = async (data) => {
    if (!user?.userId) {
      console.error('No user ID available');
      return;
    }
    
    console.log('Submitting name update:', { userId: user.userId, data });
    setIsSubmitting(true);
    
    try {
      await updateUserMutation.mutateAsync({
        userId: user.userId,
        updateData: {
          firstName: data.firstName.trim(),
          lastName: data.lastName.trim(),
        },
      });
      
      console.log('Name update successful');
      
      // Refresh user context if available
      if (refreshUser) {
        await refreshUser();
      }
      
      onOpenChange(false);
      reset();
    } catch (error) {
      console.error('Error updating name:', error);
      console.error('Error details:', error.response?.data);
      console.error('Error status:', error.response?.status);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen) => {
    if (!newOpen) {
      const { firstName: currentFirstName, lastName: currentLastName } = parseName(user?.name);
      reset({
        firstName: currentFirstName,
        lastName: currentLastName,
      });
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Update Name</DialogTitle>
          <DialogDescription>
            Enter your first name and last name below.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field>
            <FieldLabel>First Name</FieldLabel>
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
            <FieldLabel>Last Name</FieldLabel>
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
            <FieldDescription>
              Your full name will be used for your profile.
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
              {isSubmitting || updateUserMutation.isPending ? 'Updating...' : 'Update Name'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

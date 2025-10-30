import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useUpdateUser, useSendEmailOtp } from '../hooks/useUsers';
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
import { Loader2, CheckCircle, Mail, ArrowLeft } from 'lucide-react';
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from './ui/input-otp';

// Schema for OTP verification with new email
const emailOtpSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

export const UpdateEmailDialog = ({ open, onOpenChange }) => {
  const { user, refreshUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [step, setStep] = useState(1); // 1: Send OTP, 2: Enter email and OTP
  const [otpSent, setOtpSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [countdown, setCountdown] = useState(0);
  
  const {
    register: registerEmailOtp,
    handleSubmit: handleSubmitEmailOtp,
    formState: { errors: emailOtpErrors },
    reset: resetEmailOtp,
    setValue: setValueEmailOtp,
    watch: watchEmailOtp,
  } = useForm({
    resolver: zodResolver(emailOtpSchema),
    defaultValues: {
      email: '',
      otp: '',
    },
  });

  // Update form when dialog opens
  useEffect(() => {
    if (open) {
      resetEmailOtp({ email: '', otp: '' });
      setStep(1);
      setShowSuccess(false);
      setErrorMessage('');
      setOtpSent(false);
      setCountdown(0);
    }
  }, [open, resetEmailOtp]);

  // Countdown timer for resend OTP
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const updateUserMutation = useUpdateUser();
  const sendOtpMutation = useSendEmailOtp();

  const onSubmitEmail = async () => {
    if (!user?.userId || !user?.email) {
      console.error('No user ID or email available');
      return;
    }
    
    setIsSubmitting(true);
    setErrorMessage('');
    
    try {
      // Send OTP to current email
      const response = await sendOtpMutation.mutateAsync({
        userId: user.userId,
        email: user.email,
      });
      
      console.log('OTP sent successfully:', response);
      
      setOtpSent(true);
      setStep(2);
      setCountdown(60); // 60 seconds countdown
      setIsSubmitting(false);
    } catch (error) {
      console.error('Error sending OTP:', error);
      console.error('Error details:', error.response?.data);
      
      if (error.response?.status === 400) {
        setErrorMessage('Invalid request. Please try again.');
      } else if (error.response?.data?.message) {
        setErrorMessage(error.response.data.message);
      } else {
        setErrorMessage('Failed to send OTP. Please try again.');
      }
      setIsSubmitting(false);
    }
  };

  const onSubmitOtp = async (data) => {
    if (!user?.userId) {
      console.error('No user ID available');
      return;
    }
    
    setIsSubmitting(true);
    setErrorMessage('');
    
    try {
      // Update email with OTP (user provides both new email and OTP)
      await updateUserMutation.mutateAsync({
        userId: user.userId,
        updateData: { 
          email: data.email,
          otp: data.otp,
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
        setStep(1);
        resetEmailOtp();
      }, 1500);
    } catch (error) {
      console.error('Error updating email:', error);
      
      if (error.response?.status === 400 || error.response?.status === 401) {
        setErrorMessage('Invalid or expired OTP. Please try again.');
      } else {
        setErrorMessage('Failed to update email. Please try again.');
      }
      
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0 || !user?.userId || !user?.email) return;
    
    setErrorMessage('');
    try {
      await sendOtpMutation.mutateAsync({
        userId: user.userId,
        email: user.email,
      });
      setCountdown(60);
    } catch (error) {
      console.error('Error resending OTP:', error);
      setErrorMessage('Failed to resend OTP. Please try again.');
    }
  };

  const handleBack = () => {
    setStep(1);
    setErrorMessage('');
    resetEmailOtp({ email: '', otp: '' });
  };

  const handleOpenChange = (newOpen) => {
    if (!newOpen && !isSubmitting) {
      resetEmailOtp({ email: '', otp: '' });
      setStep(1);
      setShowSuccess(false);
      setErrorMessage('');
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        {showSuccess ? (
          // Success State
          <div className="flex flex-col items-center justify-center py-8">
            <div className="rounded-full bg-green-100 p-3 mb-4">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <DialogTitle className="text-xl font-semibold text-center mb-2">
              Email Updated Successfully!
            </DialogTitle>
            <DialogDescription className="text-center">
              Your email address has been updated.
            </DialogDescription>
          </div>
        ) : step === 1 ? (
          // Step 1: Send OTP
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Update Email Address
              </DialogTitle>
              <DialogDescription>
                We'll send a verification code to your current email address ({user?.email})
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              {errorMessage && (
                <div className="text-sm text-red-500 text-center">
                  {errorMessage}
                </div>
              )}
              
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
                  type="button"
                  onClick={onSubmitEmail}
                  disabled={isSubmitting || sendOtpMutation.isPending}
                >
                  {isSubmitting || sendOtpMutation.isPending ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Sending...
                    </>
                  ) : (
                    'Send Verification Code'
                  )}
                </Button>
              </DialogFooter>
            </div>
          </>
        ) : (
          // Step 2: Enter new email and OTP
          <>
            <DialogHeader>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="absolute left-4 top-4 h-8 w-8 p-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <DialogTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Verify & Update Email
              </DialogTitle>
              <DialogDescription>
                Enter the verification code sent to {user?.email} and your new email address
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmitEmailOtp(onSubmitOtp)} className="space-y-4">
              <Field>
                <FieldLabel>New Email Address</FieldLabel>
                <FieldGroup>
                  <Input
                    {...registerEmailOtp('email')}
                    type="email"
                    placeholder="Enter your new email address"
                    className={emailOtpErrors.email ? 'border-red-500' : ''}
                    disabled={isSubmitting}
                  />
                </FieldGroup>
                {emailOtpErrors.email && (
                  <FieldError>{emailOtpErrors.email.message}</FieldError>
                )}
              </Field>

              <Field>
                <FieldLabel>Verification Code</FieldLabel>
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={watchEmailOtp('otp') || ''}
                    onChange={(value) => setValueEmailOtp('otp', value)}
                    disabled={isSubmitting}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                    </InputOTPGroup>
                    <InputOTPSeparator />
                    <InputOTPGroup>
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                {emailOtpErrors.otp && (
                  <FieldError className="text-center">{emailOtpErrors.otp.message}</FieldError>
                )}
                {errorMessage && (
                  <FieldError className="text-center">{errorMessage}</FieldError>
                )}
              </Field>

              <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                {countdown > 0 ? (
                  <>Resend code in {countdown}s</>
                ) : (
                  <>
                    Didn't receive the code?{' '}
                    <Button
                      type="button"
                      variant="link"
                      className="h-auto p-0 text-sm"
                      onClick={handleResendOtp}
                      disabled={sendOtpMutation.isPending}
                    >
                      Resend
                    </Button>
                  </>
                )}
              </div>

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
                  disabled={isSubmitting || updateUserMutation.isPending || (watchEmailOtp('otp')?.length || 0) !== 6}
                >
                  {isSubmitting || updateUserMutation.isPending ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Verifying...
                    </>
                  ) : (
                    'Verify & Update Email'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

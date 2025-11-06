import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSearchParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Clock, RefreshCw, ShieldCheck, Mail } from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '../lib/apiClient';

import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter} from '../components/ui/card';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import { Badge } from '@/components/ui/badge';

const registerSchema = z.object({
    otp: z.string().min(6, 'OTP must be exactly 6 digits').max(6, 'OTP must be exactly 6 digits')
});

export const VerifyPage = () => {
  const form = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
        otp: ''
    }
  });
  let navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email');
  const type = searchParams.get('type');
  
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  const [isResending, setIsResending] = useState(false);

  const { verifyOtp, forgotPassword } = useAuth();

  // OTP Timer countdown
  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleResendOtp = async () => {
    setIsResending(true);
    try {
      if (type === 'forgot-password') {
        // Call forgot password endpoint
        await forgotPassword(email);
      } else {
        // Call new OTP endpoint for email verification
        await apiClient.post(`/users/new-otp/${encodeURIComponent(email)}`);
      }
      
      setTimeLeft(300); // Reset timer to 5 minutes
      toast.success('OTP Resent', {
        description: 'A new OTP has been sent to your email.',
      });
    } catch (error) {
      console.error('Failed to resend OTP:', error);
      toast.error('Failed to Resend', {
        description: 'Could not resend OTP. Please try again.',
      });
    } finally {
      setIsResending(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      console.log('Form data:', data);
      await verifyOtp(email, data.otp);
      
      // Clean up sessionStorage on successful verification
      if (type !== 'forgot-password') {
        // Remove all pending verification entries for this email
        Object.keys(sessionStorage).forEach(key => {
          if (key.startsWith('pending_verification_') && sessionStorage.getItem(key) === email) {
            sessionStorage.removeItem(key);
          }
        });
        
        toast.success('Email Verified!', {
          description: 'You can now login with your credentials.',
        });
      }
      
      if (type === 'forgot-password') {
        navigate("/reset-password?email=" + encodeURIComponent(email));
      } else {
        // Check if there's a saved redirect after verification
        const redirectPath = sessionStorage.getItem('redirectAfterLogin');
        if (redirectPath) {
          // Keep it for after login
          navigate("/login");
        } else {
          navigate("/login");
        }
      }
      console.log(email + ' ' + data.otp + ' Verification successful');
    } catch (error) {
      console.log('Verification failed:', error);
      toast.error('Verification Failed', {
        description: 'Invalid OTP. Please check and try again.',
      });
    }
  };

  const isForgotPassword = type === 'forgot-password';
  const pageTitle = isForgotPassword ? 'Verify OTP' : 'Verify Account';
  const pageDescription = isForgotPassword 
    ? 'Please enter the OTP sent to your email to reset your password'
    : 'Please enter the OTP sent to your email to verify your account';

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <Card className="w-full sm:max-w-md shadow-lg">
        <CardHeader className="space-y-3">
          <div className="flex items-center justify-center mb-2">
            <div className="p-3 rounded-2xl bg-primary/10">
              <ShieldCheck className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="flex items-center justify-between text-2xl font-bold">
            <span>{pageTitle}</span>
            <Badge 
              variant={timeLeft > 60 ? "secondary" : "destructive"} 
              className="flex items-center gap-1.5 text-sm font-mono"
            >
              <Clock className="h-3.5 w-3.5" />
              {formatTime(timeLeft)}
            </Badge>
          </CardTitle>
          <CardDescription className="text-center text-base">
            {pageDescription}
          </CardDescription>
          {email && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg p-2 mt-2">
              <Mail className="h-4 w-4" />
              <span className="font-medium">{email}</span>
            </div>
          )}
          {timeLeft === 0 && (
            <p className="text-sm text-destructive font-medium mt-2 text-center bg-destructive/10 rounded-lg p-3 border border-destructive/20">
              ⚠️ OTP has expired. Please request a new one.
            </p>
          )}
        </CardHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} id="form-rhf-verify">
          <CardContent>
            <FieldGroup className="flex flex-col gap-4">
                <Controller
                  name="otp"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid} className="w-full">
                      <InputOTP 
                        maxLength={6} 
                        value={field.value} 
                        onChange={field.onChange}
                        className="w-full justify-between"
                        disabled={timeLeft === 0}
                      >
                          <InputOTPGroup className="w-full">
                            <InputOTPSlot index={0} className="flex-1 h-14 text-xl font-bold" />
                            <InputOTPSlot index={1} className="flex-1 h-14 text-xl font-bold" />
                            <InputOTPSlot index={2} className="flex-1 h-14 text-xl font-bold" />
                            <InputOTPSlot index={3} className="flex-1 h-14 text-xl font-bold" />
                            <InputOTPSlot index={4} className="flex-1 h-14 text-xl font-bold" />
                            <InputOTPSlot index={5} className="flex-1 h-14 text-xl font-bold" />
                          </InputOTPGroup>
                      </InputOTP>
                      {fieldState.invalid && (
                        <FieldError className="flex items-center gap-1.5 mt-2">
                          <span className="h-1 w-1 rounded-full bg-destructive" />
                          {fieldState.error?.message}
                        </FieldError>
                      )}
                    </Field>
                  )}
                />
            </FieldGroup>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <div className="w-full flex items-center justify-between">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleResendOtp}
                disabled={isResending || timeLeft > 0}
                className="text-sm font-medium"
              >
                {isResending ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Resending...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Resend OTP
                  </>
                )}
              </Button>
              {!isForgotPassword && (
                <Link to="/login" className="text-sm hover:underline text-muted-foreground font-medium">
                  Back to Login
                </Link>
              )}
            </div>
            <Field>
              <Button 
                type="submit" 
                className="w-full h-11 text-base font-semibold" 
                disabled={form.formState.isSubmitting || timeLeft === 0}
              >
                {form.formState.isSubmitting 
                  ? (
                    <>
                      <div className="h-4 w-4 mr-2 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4 mr-2" />
                      {isForgotPassword ? 'Verify OTP' : 'Verify Account'}
                    </>
                  )}
              </Button>
            </Field>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};
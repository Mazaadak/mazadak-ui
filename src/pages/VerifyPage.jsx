import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSearchParams } from 'react-router-dom';

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

  const { verifyOtp } = useAuth();

  const onSubmit = async (data) => {
    try {
      console.log('Form data:', data);
      await verifyOtp(email, data.otp);
      if (type === 'forgot-password') {
        navigate("/reset-password?email=" + encodeURIComponent(email));
      } else {
        navigate("/login");
      }
      console.log(email + ' ' + data.otp + ' Verification successful');
    } catch (error) {
      console.log('Verification failed:', error);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <Card className="w-full sm:max-w-md">
        <CardHeader>
          <CardTitle>Verify Email</CardTitle>
          <CardDescription>Please enter the OTP sent to your email</CardDescription>
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
                      >
                          <InputOTPGroup className="w-full">
                            <InputOTPSlot index={0} className="flex-1 h-12 text-lg" />
                            <InputOTPSlot index={1} className="flex-1 h-12 text-lg" />
                            <InputOTPSlot index={2} className="flex-1 h-12 text-lg" />
                            <InputOTPSlot index={3} className="flex-1 h-12 text-lg" />
                            <InputOTPSlot index={4} className="flex-1 h-12 text-lg" />
                            <InputOTPSlot index={5} className="flex-1 h-12 text-lg" />
                          </InputOTPGroup>
                      </InputOTP>
                      {fieldState.invalid && (
                        <FieldError>{fieldState.error?.message}</FieldError>
                      )}
                    </Field>
                  )}
                />
            </FieldGroup>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Field>
              <Link to="/login" className="text-sm hover:underline">
                Already have an account? Log in
              </Link>
            </Field>
            <Field>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? 'Verifying your account...' : 'Verify your account'}
              </Button>
            </Field>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { Lock, ShieldCheck, Check } from 'lucide-react';

const resetPasswordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  confirmPassword: z.string().min(6, 'Confirm Password must be at least 6 characters long'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords must match',
  path: ['confirmPassword'],
});

export const ResetPasswordPage = () => {
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data) => {
    try {
    console.log('Form data:', data);
      await resetPassword(data.password);
      navigate('/login');
    } catch (error) {
      console.log('Reset password failed:', error);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-3">
          <div className="flex items-center justify-center mb-2">
            <div className="p-3 rounded-2xl bg-primary/10">
              <ShieldCheck className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-3xl text-center font-bold">
            Reset Password
          </CardTitle>
          <CardDescription className="text-center text-base">
            Enter your new password to secure your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className='flex flex-col gap-3'>
              <Label htmlFor="password" className="flex items-center gap-2 text-sm font-semibold">
                <Lock className="h-4 w-4 text-primary" />
                New Password
              </Label>
              <Input 
                id="password" 
                type="password" 
                {...register('password')} 
                placeholder="Enter your new password" 
                className="h-11"
              />
              {errors.password && <p className="text-sm text-destructive flex items-center gap-1.5 mt-1">
                <span className="h-1 w-1 rounded-full bg-destructive" />
                {errors.password.message}
              </p>}
            </div>
            <div className='flex flex-col gap-3'>
              <Label htmlFor="confirmPassword" className="flex items-center gap-2 text-sm font-semibold">
                <Check className="h-4 w-4 text-primary" />
                Confirm New Password
              </Label>
              <Input 
                id="confirmPassword" 
                type="password" 
                {...register('confirmPassword')} 
                placeholder="Confirm your new password" 
                className="h-11"
              />
              {errors.confirmPassword && <p className="text-sm text-destructive flex items-center gap-1.5 mt-1">
                <span className="h-1 w-1 rounded-full bg-destructive" />
                {errors.confirmPassword.message}
              </p>}
            </div>
            <Button 
              type="submit" 
              className="w-full h-11 text-base font-semibold" 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 mr-2 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Changing Password...
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4 mr-2" />
                  Change Password
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
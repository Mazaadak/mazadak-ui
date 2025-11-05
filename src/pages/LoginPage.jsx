import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import apiClient from '../lib/apiClient';
import { LogIn, User, Lock, Sparkles } from 'lucide-react';

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data) => {
    try {
      await login(data.username, data.password);
      
      // Check if there's a saved redirect destination
      const redirectPath = sessionStorage.getItem('redirectAfterLogin');
      if (redirectPath) {
        sessionStorage.removeItem('redirectAfterLogin');
        navigate(redirectPath);
      } else {
        navigate('/');
      }
    } catch (error) {
      console.log('Login failed:', error);
      
      if (error.type === 'UNVERIFIED_EMAIL') {
        // Try to get email from sessionStorage (stored during registration)
        const storedEmail = sessionStorage.getItem(`pending_verification_${data.username}`);
        const emailToUse = error.email || storedEmail || data.username;
        
        try {
          // Send OTP before redirecting
          await apiClient.post(`/users/new-otp/${encodeURIComponent(emailToUse)}`);
          
          toast.success('Verification Required', {
            description: 'A new OTP has been sent to your email.',
            duration: 4000,
          });
        } catch (otpError) {
          console.error('Failed to send OTP:', otpError);
          // Still redirect even if OTP send fails - user can resend from verify page
          toast.error('Email Not Verified', {
            description: 'Please verify your email. You can resend OTP from the verification page.',
            duration: 5000,
          });
        }
        
        // Redirect to verification page
        navigate(`/verify?email=${encodeURIComponent(emailToUse)}&type=registration`);
      } else {
        toast.error('Login Failed', {
          description: 'Invalid username or password.',
        });
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-3">
          <div className="flex items-center justify-center mb-2">
            <div className="p-3 rounded-2xl bg-primary/10">
              <LogIn className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-3xl text-center font-bold">
            Welcome Back
          </CardTitle>
          <CardDescription className="text-center text-base">
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className='flex flex-col gap-3'>
              <Label htmlFor="username" className="flex items-center gap-2 text-sm font-semibold">
                <User className="h-4 w-4 text-primary" />
                Username
              </Label>
              <Input 
                id="username" 
                {...register('username')} 
                className="h-11"
                placeholder="Enter your username"
              />
              {errors.username && <p className="text-sm text-destructive flex items-center gap-1.5 mt-1">
                <span className="h-1 w-1 rounded-full bg-destructive" />
                {errors.username.message}
              </p>}
            </div>
            <div className='flex flex-col gap-3'>
              <Label htmlFor="password" className="flex items-center gap-2 text-sm font-semibold">
                <Lock className="h-4 w-4 text-primary" />
                Password
              </Label>
              <Input 
                id="password" 
                type="password" 
                {...register('password')} 
                className="h-11"
                placeholder="Enter your password"
              />
              {errors.password && <p className="text-sm text-destructive flex items-center gap-1.5 mt-1">
                <span className="h-1 w-1 rounded-full bg-destructive" />
                {errors.password.message}
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
                  Logging in...
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4 mr-2" />
                  Login
                </>
              )}
            </Button>
          </form>
          <div className="mt-6 text-center text-sm space-y-3">
            <Link 
              to="/forgot-password" 
              className="text-primary hover:underline block font-medium"
            >
              Forgot password?
            </Link>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  New here?
                </span>
              </div>
            </div>
            <p className="text-muted-foreground">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary hover:underline font-semibold">
                Sign up
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
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
      navigate('/');
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
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>Enter your credentials to access your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className='flex flex-col gap-3'>
              <Label htmlFor="username">Username</Label>
              <Input id="username" {...register('username')} />
              {errors.username && <p className="text-sm text-red-500 mt-1">{errors.username.message}</p>}
            </div>
            <div className='flex flex-col gap-3'>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" {...register('password')} />
              {errors.password && <p className="text-sm text-red-500 mt-1">{errors.password.message}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Logging in...' : 'Login'}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm space-y-2">
            <Link to="/forgot-password" className="text-primary hover:underline block">
              Forgot password?
            </Link>
            <p>
              Don't have an account?{' '}
              <Link to="/register" className="text-primary hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
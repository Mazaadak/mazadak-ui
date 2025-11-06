import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { Mail, ArrowLeft, KeyRound } from 'lucide-react';

const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
});

export const ForgotPasswordPage = () => {
  const { forgotPassword } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data) => {
    try {
      await forgotPassword(data.email);
      navigate('/verify?email=' + encodeURIComponent(data.email)+ '&type=forgot-password');
    } catch (error) {
      console.log('Forgot password failed:', error);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-3">
          <div className="flex items-center justify-center mb-2">
            <div className="p-3 rounded-2xl bg-primary/10">
              <KeyRound className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-3xl text-center font-bold">
            Forgot Password?
          </CardTitle>
          <CardDescription className="text-center text-base">
            No worries! Enter your email and we'll send you a reset code
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className='flex flex-col gap-3'>
              <Label htmlFor="email" className="flex items-center gap-2 text-sm font-semibold">
                <Mail className="h-4 w-4 text-primary" />
                Email Address
              </Label>
              <Input 
                id="email" 
                {...register('email')} 
                placeholder="your.email@example.com" 
                className="h-11"
              />
              {errors.email && <p className="text-sm text-destructive flex items-center gap-1.5 mt-1">
                <span className="h-1 w-1 rounded-full bg-destructive" />
                {errors.email.message}
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
                  Sending Reset Code...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Send Reset Code
                </>
              )}
            </Button>
          </form>
          <div className="mt-6 text-center">
            <Link 
              to="/login" 
              className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-2 font-medium group"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              Back to Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
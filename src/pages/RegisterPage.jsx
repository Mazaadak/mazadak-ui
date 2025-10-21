import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter} from '../components/ui/card';
import { ChevronDownIcon } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const registerSchema = z.object({
  firstName: z
  .string()
  .min(1, 'First name is required'),
  lastName: z
  .string()
  .min(1, 'Last name is required'),
  username: z
  .string()
  .min(1, 'Username is required'),
  email: z
  .string()
  .email('Invalid email address'),
  password: z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  phoneNumber: z
  .string()
  .min(10, 'Phone number must be at least 10 digits long'),
  dateOfBirth: z.date().refine((date) => {
    const today = new Date();
    const age = today.getFullYear() - date.getFullYear();
    return age >= 13;
  }, 'You must be at least 13 years old'),
  gender: z.enum(['Male', 'Female'])
});

export const RegisterPage = () => {
  const form = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      username: '',
      email: '',
      password: '',
      phoneNumber: '',
      gender: undefined,
      dateOfBirth: undefined,
    },
  });

  const navigate = useNavigate();
  const { register: registerAuth } = useAuth();

  const onSubmit = async (data) => {
    try {
      data.gender = data.gender == "Male" ? "M" : "F";
      const payload = {
        ...data,
        birthDate: data.dateOfBirth?.toISOString().split("T")[0], // "YYYY-MM-DD"
      };
      console.log('Form data:', payload);
      await registerAuth(payload);
      console.log('Registration successful');
      navigate(`/verify?email=${encodeURIComponent(data.email)}`);
    } catch (error) {
      console.log('Registration failed:', error);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <Card className="w-full sm:max-w-md">
        <CardHeader>
          <CardTitle>Create New Account</CardTitle>
          <CardDescription>Create an account to access Mazadak</CardDescription>
        </CardHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent>
            <FieldGroup>
              <div className="flex flex-row gap-3">
                <Controller
                  name="firstName"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="form-rhf-register-first-name">
                        First Name
                      </FieldLabel>
                      <Input
                        {...field}
                        id="form-rhf-register-first-name"
                        aria-invalid={fieldState.invalid}
                        placeholder="Hassan"
                        autoComplete="off"
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
                <Controller
                  name="lastName"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="form-rhf-register-last-name">
                        Last Name
                      </FieldLabel>
                      <Input
                        {...field}
                        id="form-rhf-register-last-name"
                        aria-invalid={fieldState.invalid}
                        placeholder="Ali"
                        autoComplete="off"
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </div>

              <Controller
                name="email"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="form-rhf-register-email">
                      Email
                    </FieldLabel>
                    <Input
                      {...field}
                      id="form-rhf-register-email"
                      aria-invalid={fieldState.invalid}
                      placeholder="example@example.com"
                      autoComplete="off"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="username"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="form-rhf-register-username">
                      Username
                    </FieldLabel>
                    <Input
                      {...field}
                      id="form-rhf-register-username"
                      aria-invalid={fieldState.invalid}
                      placeholder="bogz2"
                      autoComplete="off"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="password"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="form-rhf-register-password">
                      Password
                    </FieldLabel>
                    <Input
                      {...field}
                      id="form-rhf-register-password"
                      type="password"
                      placeholder="********"
                      aria-invalid={fieldState.invalid}
                      autoComplete="off"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="phoneNumber"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="form-rhf-register-phone">
                      Phone Number
                    </FieldLabel>
                    <Input
                      {...field}
                      id="form-rhf-register-phone"
                      aria-invalid={fieldState.invalid}
                      placeholder="1234567890"
                      autoComplete="off"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="gender"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="form-rhf-register-gender">
                      Gender
                    </FieldLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose Gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
<Controller
  name="dateOfBirth"
  control={form.control}
  render={({ field, fieldState }) => (
    <Field data-invalid={fieldState.invalid}>
      <FieldLabel htmlFor="form-rhf-register-dateOfBirth">
        Date of Birth
      </FieldLabel>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            id="date"
            className="w-full justify-between font-normal"
          >
            {field.value ? field.value.toLocaleDateString() : "Select date"}
            <ChevronDownIcon />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={field.value}
            captionLayout="dropdown"
            onSelect={field.onChange}
            initialFocus
            fromYear={1900}
            toYear={new Date().getFullYear()}
          />
        </PopoverContent>
      </Popover>
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
                {form.formState.isSubmitting ? 'Creating an account...' : 'Create an Account'}
              </Button>
            </Field>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};
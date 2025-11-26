import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { 
  AlertCircle, 
  Bug, 
  CheckCircle2, 
  Info, 
  ShieldAlert,
  Server,
  Network,
  FileQuestion,
  Lock,
  Ban
} from 'lucide-react';
import { testErrorScenarios, isValidationError, getValidationErrors, showErrorToast, getErrorMessage } from '../lib/errorUtils';

export default function ErrorTestPage() {
  const [lastTested, setLastTested] = useState('');
  const [formData, setFormData] = useState({
    amount: '',
    email: '',
    username: ''
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState('');

  const handleTest = (testName, testFn) => {
    testFn();
    setLastTested(testName);
  };

  const handleValidationTest = (errorType) => {
    setFieldErrors({});
    setGeneralError('');

    if (errorType === 'single') {
      const mockError = {
        status: 400,
        title: 'Validation Failed',
        detail: 'Invalid Request',
        errors: {
          amount: 'Amount must be at least $10.00'
        }
      };
      if (isValidationError(mockError)) {
        setFieldErrors(getValidationErrors(mockError));
      }
    } else if (errorType === 'multiple') {
      const mockError = {
        status: 400,
        title: 'Validation Failed',
        detail: 'Multiple fields are invalid',
        errors: {
          amount: 'Amount must be at least $10.00',
          email: 'Email address is invalid',
          username: 'Username must be at least 3 characters'
        }
      };
      if (isValidationError(mockError)) {
        setFieldErrors(getValidationErrors(mockError));
      }
    } else if (errorType === 'general') {
      const mockError = {
        status: 400,
        title: 'Bad Request',
        detail: 'You cannot bid on your own auction'
      };
      setGeneralError(getErrorMessage(mockError));
    }
    setLastTested(`Form Validation - ${errorType}`);
  };

  const handleClearErrors = () => {
    setFieldErrors({});
    setGeneralError('');
    setLastTested('Cleared form errors');
  };

  const testCategories = [
    {
      title: 'General Errors',
      description: 'Test general error messages without field-specific details',
      icon: ShieldAlert,
      color: 'text-red-500',
      tests: [
        { 
          name: 'General Error', 
          key: 'generalError',
          description: 'Standard error message (400)',
          icon: ShieldAlert
        },
        { 
          name: 'Not Found', 
          key: 'notFoundError',
          description: 'Resource not found (404)',
          icon: FileQuestion
        }
      ]
    },
    {
      title: 'Authentication & Authorization',
      description: 'Test auth-related error scenarios',
      icon: Lock,
      color: 'text-purple-500',
      tests: [
        { 
          name: 'Unauthorized', 
          key: 'unauthorizedError',
          description: 'Authentication required (401)',
          icon: Lock
        },
        { 
          name: 'Forbidden', 
          key: 'forbiddenError',
          description: 'Insufficient permissions (403)',
          icon: Ban
        }
      ]
    },
    {
      title: 'Server Errors',
      description: 'Test server-side error handling',
      icon: Server,
      color: 'text-rose-500',
      tests: [
        { 
          name: 'Server Error', 
          key: 'serverError',
          description: 'Internal server error (500)',
          icon: Server
        }
      ]
    },
    {
      title: 'Network Errors',
      description: 'Test network connectivity issues',
      icon: Network,
      color: 'text-blue-500',
      tests: [
        { 
          name: 'Network Error', 
          key: 'networkError',
          description: 'No network connection',
          icon: Network
        }
      ]
    },
    {
      title: 'Success & Info Messages',
      description: 'Test positive feedback and informational messages',
      icon: CheckCircle2,
      color: 'text-green-500',
      tests: [
        { 
          name: 'Success Message', 
          key: 'successMessage',
          description: 'Operation completed successfully',
          icon: CheckCircle2
        },
        { 
          name: 'Info Message', 
          key: 'infoMessage',
          description: 'Informational notification',
          icon: Info
        },
        { 
          name: 'Warning Message', 
          key: 'warningMessage',
          description: 'Warning notification',
          icon: AlertCircle
        }
      ]
    }
  ];

  return (
    <div className="container max-w-6xl py-8 mx-auto">
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-3 mb-2">
          <Bug className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Error Handling Test Suite</h1>
        </div>
        <p className="text-muted-foreground">
          Test all error scenarios to verify proper error handling, validation, and user feedback across the application.
        </p>
        {lastTested && (
          <div className="mt-4">
            <Badge variant="outline" className="text-sm">
              Last tested: {lastTested}
            </Badge>
          </div>
        )}
      </div>

      <div className="grid gap-6">
        {/* Form Validation Section */}
        <Card>
          <CardHeader>
            <div className="flex flex-col items-center gap-3 text-center">
              <AlertCircle className="h-6 w-6 text-amber-500" />
              <div>
                <CardTitle>Form Validation Errors</CardTitle>
                <CardDescription>Test field-specific validation errors and see them displayed inline</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* General Error Display */}
            {generalError && (
              <div className="flex items-start gap-2 p-3 bg-destructive/10 text-destructive rounded-md">
                <AlertCircle className="h-4 w-4 mt-0.5" />
                <p className="text-sm">{generalError}</p>
              </div>
            )}

            {/* Sample Form */}
            <div className="max-w-md mx-auto space-y-4">
              <div>
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="Enter amount"
                  value={formData.amount}
                  onChange={(e) => {
                    setFormData({ ...formData, amount: e.target.value });
                    setFieldErrors({ ...fieldErrors, amount: undefined });
                  }}
                  className={fieldErrors.amount ? 'border-destructive focus-visible:ring-destructive' : ''}
                />
                {fieldErrors.amount && (
                  <p className="text-sm text-destructive mt-1.5 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {fieldErrors.amount}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter email"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    setFieldErrors({ ...fieldErrors, email: undefined });
                  }}
                  className={fieldErrors.email ? 'border-destructive focus-visible:ring-destructive' : ''}
                />
                {fieldErrors.email && (
                  <p className="text-sm text-destructive mt-1.5 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {fieldErrors.email}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter username"
                  value={formData.username}
                  onChange={(e) => {
                    setFormData({ ...formData, username: e.target.value });
                    setFieldErrors({ ...fieldErrors, username: undefined });
                  }}
                  className={fieldErrors.username ? 'border-destructive focus-visible:ring-destructive' : ''}
                />
                {fieldErrors.username && (
                  <p className="text-sm text-destructive mt-1.5 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {fieldErrors.username}
                  </p>
                )}
              </div>
            </div>

            {/* Test Buttons */}
            <div className="flex flex-wrap gap-2 justify-center">
              <Button
                onClick={() => handleValidationTest('single')}
                variant="outline"
                size="sm"
              >
                Single Field Error
              </Button>
              <Button
                onClick={() => handleValidationTest('multiple')}
                variant="outline"
                size="sm"
              >
                Multiple Field Errors
              </Button>
              <Button
                onClick={() => handleValidationTest('general')}
                variant="outline"
                size="sm"
              >
                General Error
              </Button>
              <Button
                onClick={handleClearErrors}
                variant="outline"
                size="sm"
              >
                Clear Errors
              </Button>
            </div>
          </CardContent>
        </Card>

        {testCategories.map((category, idx) => {
          const CategoryIcon = category.icon;
          return (
            <Card key={idx}>
              <CardHeader>
                <div className="flex flex-col items-center gap-3 text-center">
                  <CategoryIcon className={`h-6 w-6 ${category.color}`} />
                  <div>
                    <CardTitle>{category.title}</CardTitle>
                    <CardDescription>{category.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {category.tests.map((test) => {
                    const TestIcon = test.icon;
                    return (
                      <Card key={test.key} className="border-muted">
                        <CardContent className="pt-6">
                          <div className="flex flex-col gap-3 items-center text-center">
                            <div className="flex flex-col items-center gap-2">
                              <TestIcon className="h-5 w-5 text-muted-foreground" />
                              <div>
                                <h4 className="font-semibold text-sm mb-1">{test.name}</h4>
                                <p className="text-xs text-muted-foreground">{test.description}</p>
                              </div>
                            </div>
                            <Button
                              onClick={() => handleTest(test.name, testErrorScenarios[test.key])}
                              size="sm"
                              variant={lastTested === test.name ? 'default' : 'outline'}
                              className="w-full"
                            >
                              Test
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Separator className="my-8" />

      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-lg">How to Use This Test Suite</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            <strong className="text-foreground">1. Click any test button</strong> to trigger that specific error scenario.
          </p>
          <p>
            <strong className="text-foreground">2. Observe the feedback</strong> in toast notifications at the bottom-right of the screen.
          </p>
          <p>
            <strong className="text-foreground">3. Validation errors</strong> will show detailed field-specific messages.
          </p>
          <p>
            <strong className="text-foreground">4. General errors</strong> will display user-friendly error messages.
          </p>
          <p>
            <strong className="text-foreground">5. Check the console</strong> for detailed error information in development mode.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

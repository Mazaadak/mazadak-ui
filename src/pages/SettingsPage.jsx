import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Separator } from '../components/ui/separator';
import { Settings, User, MapPin, ChevronRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { UpdateEmailDialog } from '../components/UpdateEmailDialog';
import { UpdateNameDialog } from '../components/UpdateNameDialog';
import { UpdateBirthdateDialog } from '../components/UpdateBirthdateDialog';
import { useState } from 'react';
import { format } from 'date-fns';

export const SettingsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [isNameDialogOpen, setIsNameDialogOpen] = useState(false);
  const [isBirthdateDialogOpen, setIsBirthdateDialogOpen] = useState(false);

  // Parse name from user object (backend returns single "name" field)
  const parseName = (fullName) => {
    if (!fullName) return { firstName: '', lastName: '' };
    const parts = fullName.trim().split(' ');
    if (parts.length === 1) return { firstName: parts[0], lastName: '' };
    const firstName = parts[0];
    const lastName = parts.slice(1).join(' ');
    return { firstName, lastName };
  };

  const { firstName, lastName } = parseName(user?.name);

  // Debug: log user object
  console.log('SettingsPage user object:', user);
  console.log('parsed firstName:', firstName);
  console.log('parsed lastName:', lastName);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Settings className="h-8 w-8" />
          Settings
        </h1>
        {user?.name ? (
          <p className="text-muted-foreground mt-2 text-lg">
            {user.name}
          </p>
        ) : (
          <p className="text-muted-foreground mt-2">
            Manage your account settings and preferences
          </p>
        )}
      </div>

      <div className="space-y-6">
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Settings
            </CardTitle>
            <CardDescription>
              Update your personal information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Name</p>
                <p className="text-sm text-muted-foreground">
                  {user?.name || 'Not provided'}
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsNameDialogOpen(true)}
              >
                Edit
              </Button>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Birth Date</p>
                <p className="text-sm text-muted-foreground">
                  {user?.birthDate ? format(new Date(user.birthDate), 'PPP') : 'Not provided'}
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsBirthdateDialogOpen(true)}
              >
                Edit
              </Button>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Email</p>
                <p className="text-sm text-muted-foreground">
                  {user?.email || 'Not provided'}
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsEmailDialogOpen(true)}
              >
                Edit
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Address Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Address Management
            </CardTitle>
            <CardDescription>
              Manage your delivery addresses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline" 
              className="w-full justify-between"
              onClick={() => navigate('/address')}
            >
              <span className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                My Addresses
              </span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>

      <UpdateEmailDialog 
        open={isEmailDialogOpen} 
        onOpenChange={setIsEmailDialogOpen} 
      />
      
      <UpdateNameDialog 
        open={isNameDialogOpen} 
        onOpenChange={setIsNameDialogOpen} 
      />
      
      <UpdateBirthdateDialog 
        open={isBirthdateDialogOpen} 
        onOpenChange={setIsBirthdateDialogOpen} 
      />
    </div>
  );
};
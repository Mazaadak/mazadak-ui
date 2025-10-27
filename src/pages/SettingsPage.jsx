import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Separator } from '../components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Settings, User, MapPin, ChevronRight, Camera, AtSign, Phone } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { UpdateEmailDialog } from '../components/UpdateEmailDialog';
import { UpdateNameDialog } from '../components/UpdateNameDialog';
import { UpdateBirthdateDialog } from '../components/UpdateBirthdateDialog';
import { UpdatePhotoDialog } from '../components/UpdatePhotoDialog';
import { useState } from 'react';
import { format } from 'date-fns';

export const SettingsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [isNameDialogOpen, setIsNameDialogOpen] = useState(false);
  const [isBirthdateDialogOpen, setIsBirthdateDialogOpen] = useState(false);
  const [isPhotoDialogOpen, setIsPhotoDialogOpen] = useState(false);

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

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name[0].toUpperCase();
  };

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8 sm:py-12 max-w-4xl">
        
        {/* Enhanced Header with Better Spacing */}
        <div className="mb-8 sm:mb-12">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 p-6 sm:p-8 bg-card rounded-2xl border shadow-sm hover:shadow-lg transition-all duration-300">
            <div className="relative group cursor-pointer" onClick={() => setIsPhotoDialogOpen(true)}>
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 via-primary/20 to-primary/10 rounded-full opacity-0 group-hover:opacity-100 blur-md transition-all duration-300" />
              <Avatar className="relative h-28 w-28 sm:h-32 sm:w-32 border-4 border-background shadow-xl transition-all duration-300 group-hover:shadow-2xl group-hover:scale-[1.03] ring-2 ring-primary/10 group-hover:ring-4 group-hover:ring-primary/30">
                <AvatarImage src={user?.personalPhoto} alt={user?.name || 'Profile'} />
                <AvatarFallback className="text-3xl font-bold bg-gradient-to-br from-primary/20 to-primary/10">
                  {user?.name ? getInitials(user.name) : <User className="h-14 w-14 text-muted-foreground" />}
                </AvatarFallback>
              </Avatar>
              <div className="absolute bottom-1 right-1 p-2.5 bg-primary rounded-full shadow-xl hover:shadow-2xl hover:scale-110 transition-all duration-200 border-4 border-background group-hover:animate-pulse">
                <Camera className="h-4 w-4 text-primary-foreground" />
              </div>
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-3xl sm:text-4xl font-bold mb-2 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                {user?.name || 'Your Profile'}
              </h1>
              <p className="text-muted-foreground text-base mb-4 flex items-center gap-2 justify-center sm:justify-start">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {user?.email || 'Manage your account'}
              </p>
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                <div className="px-3 py-1.5 bg-primary/10 rounded-full text-xs font-medium text-primary border border-primary/20 hover:bg-primary/20 transition-colors">
                  <AtSign className="h-3 w-3 inline mr-1" />
                  {user?.userName || 'username'}
                </div>
                {user?.phoneNumber && (
                  <div className="px-3 py-1.5 bg-muted rounded-full text-xs font-medium text-muted-foreground border border-border hover:bg-muted/80 transition-colors">
                    <Phone className="h-3 w-3 inline mr-1" />
                    {user.phoneNumber}
                  </div>
                )}
                {user?.birthDate && (
                  <div className="px-3 py-1.5 bg-muted rounded-full text-xs font-medium text-muted-foreground border border-border hover:bg-muted/80 transition-colors">
                    <svg className="h-3 w-3 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {format(new Date(user.birthDate), 'MMM d, yyyy')}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Improved Cards with Better Spacing */}
        <div className="space-y-6">
          
          {/* Personal Information - Enhanced */}
          <Card className="border shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
            <CardHeader className="pb-4 border-b bg-gradient-to-r from-muted/30 to-transparent">
              <CardTitle className="text-xl font-bold flex items-center gap-3">
                <div className="p-2.5 bg-primary/10 rounded-lg shadow-sm">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-xl font-bold">Personal Information</div>
                  <div className="text-xs font-normal text-muted-foreground mt-0.5">Your account details and preferences</div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              
              {/* Name */}
              <div className="group flex items-center justify-between px-6 py-4 hover:bg-muted/50 transition-all duration-200 border-b">
                <div className="flex items-center gap-4 flex-1">
                  <div className="p-2.5 bg-muted rounded-lg group-hover:bg-primary/10 group-hover:shadow-sm transition-all duration-200">
                    <User className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-muted-foreground mb-0.5">Full Name</p>
                    <p className="text-base font-semibold truncate transition-colors">{user?.name || 'Not set'}</p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setIsNameDialogOpen(true)}
                  className="ml-2 hover:bg-primary/10 hover:text-primary transition-all"
                >
                  <span className="hidden sm:inline mr-2">Edit</span>
                  <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </div>

              {/* Username */}
              <div className="group flex items-center justify-between px-6 py-4 hover:bg-muted/50 transition-all duration-200 border-b">
                <div className="flex items-center gap-4 flex-1">
                  <div className="p-2.5 bg-muted rounded-lg group-hover:bg-primary/10 group-hover:shadow-sm transition-all duration-200">
                    <AtSign className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-muted-foreground mb-0.5">Username</p>
                    <p className="text-base font-semibold truncate transition-colors">@{user?.userName || 'Not set'}</p>
                  </div>
                </div>
                <div className="ml-2 px-3 py-1.5 bg-muted/60 rounded-full border border-border">
                  <p className="text-xs font-medium text-muted-foreground">Read only</p>
                </div>
              </div>

              {/* Phone Number */}
              <div className="group flex items-center justify-between px-6 py-4 hover:bg-muted/50 transition-all duration-200 border-b">
                <div className="flex items-center gap-4 flex-1">
                  <div className="p-2.5 bg-muted rounded-lg group-hover:bg-primary/10 group-hover:shadow-sm transition-all duration-200">
                    <Phone className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-muted-foreground mb-0.5">Phone Number</p>
                    <p className="text-base font-semibold truncate transition-colors">{user?.phoneNumber || 'Not set'}</p>
                  </div>
                </div>
                <div className="ml-2 px-3 py-1.5 bg-muted/60 rounded-full border border-border">
                  <p className="text-xs font-medium text-muted-foreground">Read only</p>
                </div>
              </div>

              {/* Email */}
              <div className="group flex items-center justify-between px-6 py-4 hover:bg-muted/50 transition-all duration-200 border-b">
                <div className="flex items-center gap-4 flex-1">
                  <div className="p-2.5 bg-muted rounded-lg group-hover:bg-primary/10 group-hover:shadow-sm transition-all duration-200">
                    <svg className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-muted-foreground mb-0.5">Email Address</p>
                    <p className="text-base font-semibold truncate transition-colors">{user?.email || 'Not set'}</p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setIsEmailDialogOpen(true)}
                  className="ml-2 hover:bg-primary/10 hover:text-primary transition-all"
                >
                  <span className="hidden sm:inline mr-2">Edit</span>
                  <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </div>

              {/* Birth Date */}
              <div className="group flex items-center justify-between px-6 py-4 hover:bg-muted/50 transition-all duration-200">
                <div className="flex items-center gap-4 flex-1">
                  <div className="p-2.5 bg-muted rounded-lg group-hover:bg-primary/10 group-hover:shadow-sm transition-all duration-200">
                    <svg className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-muted-foreground mb-0.5">Birth Date</p>
                    <p className="text-base font-semibold transition-colors">
                      {user?.birthDate ? format(new Date(user.birthDate), 'PPP') : 'Not set'}
                    </p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setIsBirthdateDialogOpen(true)}
                  className="ml-2 hover:bg-primary/10 hover:text-primary transition-all"
                >
                  <span className="hidden sm:inline mr-2">Edit</span>
                  <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </div>

            </CardContent>
          </Card>

          {/* Addresses - Enhanced */}
          <Card className="border shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
            <CardHeader className="pb-4 border-b bg-gradient-to-r from-muted/30 to-transparent">
              <CardTitle className="text-xl font-bold flex items-center gap-3">
                <div className="p-2.5 bg-primary/10 rounded-lg shadow-sm">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-xl font-bold">Addresses</div>
                  <div className="text-xs font-normal text-muted-foreground mt-0.5">Manage your saved addresses</div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <Button 
                variant="outline" 
                className="w-full justify-between h-16 text-base font-medium hover:bg-primary/5 hover:border-primary/30 transition-all group shadow-sm hover:shadow"
                onClick={() => navigate('/address')}
              >
                <span className="flex items-center gap-3">
                  <div className="p-2.5 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-all duration-200 shadow-sm">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-base">Manage Addresses</p>
                    <p className="text-xs text-muted-foreground font-normal">View and edit your addresses</p>
                  </div>
                </span>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </Button>
            </CardContent>
          </Card>

        </div>
      </div>

      {/* Dialogs */}
      <UpdateEmailDialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen} />
      <UpdateNameDialog open={isNameDialogOpen} onOpenChange={setIsNameDialogOpen} />
      <UpdateBirthdateDialog open={isBirthdateDialogOpen} onOpenChange={setIsBirthdateDialogOpen} />
      <UpdatePhotoDialog open={isPhotoDialogOpen} onOpenChange={setIsPhotoDialogOpen} />
    </div>
  );
};
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Separator } from '../components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { Settings, User, MapPin, ChevronRight, Camera, AtSign, Phone, Lock, AlertTriangle, CreditCard, CheckCircle2, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { UpdateEmailDialog } from '../components/UpdateEmailDialog';
import { UpdateNameDialog } from '../components/UpdateNameDialog';
import { UpdateBirthdateDialog } from '../components/UpdateBirthdateDialog';
import { UpdatePhotoDialog } from '../components/UpdatePhotoDialog';
import { UpdatePasswordDialog } from '../components/UpdatePasswordDialog';
import { DeleteAccountDialog } from '../components/DeleteAccountDialog';
import { AddressManagementModal } from '../components/AddressManagementModal';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useStripeAccount, useGetStripeOAuthUrl } from '../hooks/usePayments';
import { toast } from 'sonner';

export const SettingsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [isNameDialogOpen, setIsNameDialogOpen] = useState(false);
  const [isBirthdateDialogOpen, setIsBirthdateDialogOpen] = useState(false);
  const [isPhotoDialogOpen, setIsPhotoDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isDeleteAccountDialogOpen, setIsDeleteAccountDialogOpen] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isRedirectingToStripe, setIsRedirectingToStripe] = useState(false);

  // Check Stripe account status
  const { data: stripeAccount, isLoading: isLoadingStripe, refetch: refetchStripeAccount } = useStripeAccount(user?.userId);
  const getStripeOAuthUrl = useGetStripeOAuthUrl();

  // Handle Stripe OAuth callback on return
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const success = params.get('success');
    const accountId = params.get('accountId');
    
    if (success === 'true') {
      toast.success('Stripe account connected successfully!');
      refetchStripeAccount();
      // Clean up URL
      window.history.replaceState({}, '', '/settings');
    }
  }, [refetchStripeAccount]);

  // Handle Stripe onboarding redirect
  const handleStripeOnboarding = async () => {
    try {
      setIsRedirectingToStripe(true);
      const redirectUrl = `${window.location.origin}/settings`;
      const response = await getStripeOAuthUrl.mutateAsync({ 
        sellerId: user?.userId, 
        redirectUrl 
      });
      console.log('Stripe OAuth response:', response);
      const oauthUrl = response?.onboardingUrl || response?.url || response?.data?.onboardingUrl || response?.data?.url;
      if (oauthUrl && typeof oauthUrl === 'string') {
        window.location.href = oauthUrl;
      } else {
        console.error('Invalid OAuth URL received:', response);
        setIsRedirectingToStripe(false);
      }
    } catch (error) {
      console.error('Failed to get Stripe OAuth URL:', error);
      setIsRedirectingToStripe(false);
    }
  };

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
              <div className="group flex items-center justify-between px-6 py-4 hover:bg-muted/50 transition-all duration-200 border-b">
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

              {/* Password */}
              <div className="group flex items-center justify-between px-6 py-4 hover:bg-muted/50 transition-all duration-200">
                <div className="flex items-center gap-4 flex-1">
                  <div className="p-2.5 bg-muted rounded-lg group-hover:bg-primary/10 group-hover:shadow-sm transition-all duration-200">
                    <Lock className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-muted-foreground mb-0.5">Password</p>
                    <p className="text-base font-semibold transition-colors">••••••••</p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setIsPasswordDialogOpen(true)}
                  className="ml-2 hover:bg-primary/10 hover:text-primary transition-all"
                >
                  <span className="hidden sm:inline mr-2">Change</span>
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
                onClick={() => setIsAddressModalOpen(true)}
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

          {/* Stripe Account Connection - Enhanced */}
          <Card className="border shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
            <CardHeader className="pb-4 border-b bg-gradient-to-r from-muted/30 to-transparent">
              <CardTitle className="text-xl font-bold flex items-center gap-3">
                <div className="p-2.5 bg-primary/10 rounded-lg shadow-sm">
                  <CreditCard className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-xl font-bold">Payment Account</div>
                  <div className="text-xs font-normal text-muted-foreground mt-0.5">Manage your Stripe account for receiving payments</div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {isLoadingStripe ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : stripeAccount ? (
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm text-green-900">Stripe Account Connected</h3>
                      <p className="text-xs text-green-700 mt-1">
                        Your Stripe account is connected and ready to receive payments. You can create listings and sell items.
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full justify-center h-12 text-base font-medium hover:bg-primary/5 hover:border-primary/30 transition-all shadow-sm hover:shadow"
                    onClick={handleStripeOnboarding}
                    disabled={isRedirectingToStripe}
                  >
                    {isRedirectingToStripe ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Redirecting...
                      </>
                    ) : (
                      <>
                        <CreditCard className="mr-2 h-4 w-4" />
                        Manage Stripe Account
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-lg border border-amber-200">
                    <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm text-amber-900">No Payment Account Connected</h3>
                      <p className="text-xs text-amber-700 mt-1">
                        You need to connect a Stripe account to create listings and receive payments from buyers.
                      </p>
                    </div>
                  </div>
                  <Button 
                    className="w-full justify-center h-12 text-base font-semibold shadow-sm hover:shadow"
                    onClick={handleStripeOnboarding}
                    disabled={isRedirectingToStripe}
                  >
                    {isRedirectingToStripe ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Redirecting to Stripe...
                      </>
                    ) : (
                      <>
                        <CreditCard className="mr-2 h-4 w-4" />
                        Connect Stripe Account
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Delete Account - Danger Zone */}
          {/* <Card className="border-2 border-red-200 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
            <CardHeader className="pb-4 border-b border-red-200 bg-gradient-to-r from-red-50 to-transparent">
              <CardTitle className="text-xl font-bold flex items-center gap-3">
                <div className="p-2.5 bg-red-100 rounded-lg shadow-sm">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <div className="text-xl font-bold text-red-600">Danger Zone</div>
                  <div className="text-xs font-normal text-muted-foreground mt-0.5">Irreversible actions</div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-red-50 rounded-lg border border-red-200">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm text-red-900">Delete Account</h3>
                    <p className="text-xs text-red-700 mt-1">
                      Once you delete your account, there is no going back. All your data will be permanently removed.
                    </p>
                  </div>
                </div>
                <Button 
                  variant="destructive"
                  className="w-full justify-center h-12 text-base font-semibold shadow-sm hover:shadow"
                  onClick={() => setIsDeleteAccountDialogOpen(true)}
                >
                  Delete My Account
                </Button>
              </div>
            </CardContent>
          </Card> */}

        </div>
      </div>

      {/* Dialogs */}
      <UpdateEmailDialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen} />
      <UpdateNameDialog open={isNameDialogOpen} onOpenChange={setIsNameDialogOpen} />
      <UpdateBirthdateDialog open={isBirthdateDialogOpen} onOpenChange={setIsBirthdateDialogOpen} />
      <UpdatePhotoDialog open={isPhotoDialogOpen} onOpenChange={setIsPhotoDialogOpen} />
      <UpdatePasswordDialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen} />
      <DeleteAccountDialog open={isDeleteAccountDialogOpen} onOpenChange={setIsDeleteAccountDialogOpen} />
      <AddressManagementModal open={isAddressModalOpen} onOpenChange={setIsAddressModalOpen} />
    </div>
  );
};
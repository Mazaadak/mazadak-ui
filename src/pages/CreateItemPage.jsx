import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, Link, Navigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "../components/ui/card";
import { ChevronDownIcon, CreditCard, AlertCircle, ArrowLeft, X, Package, CheckCircle2, Loader2, XCircle, Sparkles, Home, RotateCcw } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ProductSelectionStep from "../components/CreateItem/ProductSelectionStep";
import ListingTypeStep from "../components/CreateItem/ListingTypeStep";
import CreateFixedPriceForm from "../components/CreateItem/CreateFixedPriceForm";
import CreateAuctionForm from "../components/CreateItem/CreateAuctionForm";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect, useRef, useState } from "react";
import ProductCard from "../components/CreateItem/ProductCard";
import { useCreateListing, useListingStatus, useProduct } from "../hooks/useProducts";
import { v4 as uuidv4 } from "uuid";
import { productAPI } from "../api/products";
import { useStripeAccount, useGetStripeOAuthUrl } from "../hooks/usePayments";
import { toast } from 'sonner';

export const CreateItemPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Initialize state from URL params
  const [step, setStep] = useState(() => {
    const stepParam = searchParams.get('step');
    return stepParam ? parseInt(stepParam) : 0;
  });
  
  const [productId, setProductId] = useState(() => searchParams.get('productId') || null);
  
  const [type, setType] = useState(() => {
    const typeParam = searchParams.get('type');
    return typeParam || null;
  });
  
  const [listingStatus, setListingStatus] = useState("idle"); // 'idle' | 'creating' | 'success' | 'failed'
  const [createdListingId, setCreatedListingId] = useState(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  
  // Relist data from URL (for prefilling auction form)
  const [relistData, setRelistData] = useState(() => {
    const relistParam = searchParams.get('relist');
    if (relistParam) {
      try {
        return JSON.parse(decodeURIComponent(relistParam));
      } catch (e) {
        console.error('Failed to parse relist data:', e);
        return null;
      }
    }
    return null;
  });
  
  const { mutate } = useCreateListing();
  const { user } = useAuth();
  const userId = user?.userId;
  const navigate = useNavigate();
  const idempotencyKeyRef = useRef(null);
  
  // Check if user has connected Stripe account
  const { data: stripeAccount, isLoading: isLoadingStripe, error: stripeError, refetch: refetchStripeAccount } = useStripeAccount(userId);
  const getStripeOAuthUrl = useGetStripeOAuthUrl();
  const [isRedirectingToStripe, setIsRedirectingToStripe] = useState(false);
  
  // Fetch product details if productId is set
  const { data: selectedProduct, isLoading: isLoadingProduct } = useProduct(productId);
  
  // Handle Stripe OAuth callback on return
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const success = params.get('success');
    const accountId = params.get('accountId');
    
    if (success === 'true') {
      toast.success('Stripe account connected successfully! You can now create listings.');
      refetchStripeAccount();
      // Clean up URL but preserve other params
      params.delete('success');
      params.delete('accountId');
      const newSearch = params.toString();
      window.history.replaceState({}, '', `/create-item${newSearch ? '?' + newSearch : ''}`);
    }
  }, [refetchStripeAccount]);
  
  // Debug logging
  useEffect(() => {
    console.log('CreateItemPage - productId:', productId);
    console.log('CreateItemPage - selectedProduct:', selectedProduct);
    console.log('CreateItemPage - isLoadingProduct:', isLoadingProduct);
  }, [productId, selectedProduct, isLoadingProduct]);

  // Handle Stripe onboarding redirect
  const handleStripeOnboarding = async () => {
    try {
      setIsRedirectingToStripe(true);
      // Build current URL with params to return to same state
      const currentParams = new URLSearchParams(window.location.search);
      const redirectUrl = `${window.location.origin}/create-item${currentParams.toString() ? '?' + currentParams.toString() : ''}`;
      
      const response = await getStripeOAuthUrl.mutateAsync({ 
        sellerId: userId, 
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

  // Update URL when state changes
  useEffect(() => {
    const params = new URLSearchParams();
    
    if (step > 0) params.set('step', step.toString());
    if (productId) params.set('productId', productId);
    if (type) params.set('type', type);
    if (relistData) params.set('relist', encodeURIComponent(JSON.stringify(relistData)));
    
    setSearchParams(params, { replace: true });
  }, [step, productId, type, relistData, setSearchParams]);

  // Reset state when navigating to clean URL (no params)
  useEffect(() => {
    const hasParams = searchParams.toString().length > 0;
    if (!hasParams && (step !== 0 || productId || type || relistData)) {
      setStep(0);
      setProductId(null);
      setType(null);
      setRelistData(null);
      setListingStatus('idle');
      setCreatedListingId(null);
    }
  }, [searchParams]);

  // Calculate shouldPoll based on current state
  const shouldPoll = listingStatus === "creating" && !!createdListingId && !!idempotencyKeyRef.current;

  const handleProductSelected = (id) => {
    console.log("Product selected:", id);
    setProductId(id);
    setStep(1);
  };

  const handleProductCreated = (id) => {
    console.log("Product created:", id);
    setProductId(id);
    setStep(1);
  };
  
  const handleRemoveProduct = () => {
    setProductId(null);
    setType(null);
    setStep(0);
  };
  
  const handleBack = () => {
    if (step > 0 && step < 3) {
      setStep(step - 1);
      if (step === 1) {
        // Going back from listing type to product selection
        setType(null);
      }
    }
  };
  
  const handleCancel = () => {
    setShowCancelDialog(true);
  };
  
  const confirmCancel = () => {
    // Reset everything and navigate to listings
    setProductId(null);
    setType(null);
    setStep(0);
    setListingStatus('idle');
    setCreatedListingId(null);
    navigate('/listings');
  };

  const handleListingTypeSelected = (selectedType) => {
    console.log("Listing type selected:", selectedType);
    setType(selectedType);
    setStep(2);
  };

  const onSubmit = async (data) => {
    setStep(3);
    
    if (!idempotencyKeyRef.current) {
      idempotencyKeyRef.current = uuidv4();
      console.log("Generated Idempotency-Key:", idempotencyKeyRef.current);
    }

    const payload = {
      productId,
      sellerId: userId,
      type: type.toUpperCase(),
      auction:
        type === "auction"
          ? {
              title: data.title,
              startingPrice: data.startingPrice,
              reservePrice: data.reservePrice,
              bidIncrement: data.bidIncrement,
              startTime: data.startDateTime,
              endTime: data.endDateTime,
            }
          : null,
      inventory:
        type === "fixed"
          ? {
              price: data.price,
              quantity: data.quantity,
            }
          : null,
    };

    console.log("Create Item Data:", { productId, userId, type, ...data });
    
    mutate(
      { data: payload, idempotencyKey: idempotencyKeyRef.current },
      {
        onSuccess: (responseData) => {
          console.log("Listing creation request sent: ", responseData);
          
          // Store the created listing ID from the response
          if (responseData?.id) {
            setCreatedListingId(responseData.id);
          } else {
            setCreatedListingId(productId);
          }
          
          // Start polling for status
          setListingStatus("creating");
        },
        onError: (error) => {
          console.error("Error creating listing:", error);
          setListingStatus("failed");
          // Clear the ref to prevent any future polling
          idempotencyKeyRef.current = null;
        }
      }
    );
  };

  useEffect(() => {
    let pollingInterval;

    const pollStatus = async () => {
      console.log("Polling listing status...");
      if (!shouldPoll) {
        console.log("Not polling, current status:", listingStatus);
        return;
      }
      
      try {
        const status = await productAPI.getListingStatus(productId, idempotencyKeyRef.current);
        console.log("Polled status:", status);
        if (status.status === "COMPLETED") {
          console.log("Listing completed, stopping polling");
          setListingStatus("success");
          idempotencyKeyRef.current = null;
        } else if (status.status === "FAILED") {
          console.log("Listing failed, stopping polling");
          setListingStatus("failed");
          idempotencyKeyRef.current = null;
        }
      } catch (error) {
        console.error("Error polling status:", error);
      }
    };

    if (shouldPoll) {
      pollingInterval = setInterval(pollStatus, 2000);
    }

    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [shouldPoll, createdListingId, productId, listingStatus]);


  const renderStepContent = () => {
    if (step === 0) {
      return <ProductSelectionStep onSelect={handleProductSelected} onCreate={handleProductCreated} />;
    }
    
    if (step === 1) {
      return <ListingTypeStep onSelect={handleListingTypeSelected} />;
    }
    
    if (step === 2) {
      if (type === "fixed") {
        return <CreateFixedPriceForm onSubmit={onSubmit} />;
      }
      if (type === "auction") {
        return <CreateAuctionForm onSubmit={onSubmit} initialData={relistData} />;
      }
    }

    if (step === 3) {
      return (
        <CardContent className="p-8">
          <div className="text-center space-y-6 max-w-md mx-auto">
            {listingStatus === "creating" && (
              <div className="animate-in fade-in zoom-in duration-500">
                <div className="flex justify-center mb-6">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping"></div>
                    <div className="relative p-6 rounded-full bg-gradient-to-br from-primary/20 to-primary/10">
                      <Loader2 className="h-12 w-12 text-primary animate-spin" />
                    </div>
                  </div>
                </div>
                <h2 className="text-2xl font-bold mb-2">Creating Your Listing...</h2>
                <p className="text-muted-foreground">
                  Hold tight! We're setting everything up for you.
                </p>
                <div className="mt-6">
                  <Progress value={66} className="h-2" />
                </div>
              </div>
            )}

            {listingStatus === "success" && (
              <div className="animate-in fade-in zoom-in duration-500">
                <div className="flex justify-center mb-6">
                  <div className="relative">
                    {/* Confetti-style sparkles */}
                    <Sparkles className="absolute -top-2 -left-2 h-6 w-6 text-yellow-400 animate-pulse" />
                    <Sparkles className="absolute -top-2 -right-2 h-5 w-5 text-green-400 animate-pulse delay-75" />
                    <Sparkles className="absolute -bottom-2 -left-2 h-5 w-5 text-blue-400 animate-pulse delay-150" />
                    <Sparkles className="absolute -bottom-2 -right-2 h-6 w-6 text-purple-400 animate-pulse delay-100" />
                    
                    <div className="relative p-6 rounded-full bg-gradient-to-br from-green-500/20 to-green-500/10 border-2 border-green-500/30">
                      <CheckCircle2 className="h-16 w-16 text-green-600 animate-in zoom-in duration-300" strokeWidth={2.5} />
                    </div>
                  </div>
                </div>
                
                <h2 className="text-3xl font-bold text-green-600 mb-3">
                  🎉 Listing Created!
                </h2>
                <p className="text-lg text-muted-foreground mb-2">
                  Your {type === "auction" ? "auction" : "fixed price listing"} is now live.
                </p>
                <p className="text-sm text-muted-foreground">
                  Buyers can now discover and purchase your item.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-6">
                  <Button 
                    onClick={() => navigate("/listings")}
                    size="lg"
                    className="font-semibold group"
                  >
                    <Home className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" />
                    View All Listings
                  </Button>
                  <Button 
                    variant="outline" 
                    size="lg"
                    onClick={() => {
                      setStep(0);
                      setProductId(null);
                      setType(null);
                      setListingStatus("idle");
                      setCreatedListingId(null);
                    }}
                    className="font-semibold"
                  >
                    <Package className="mr-2 h-4 w-4" />
                    Create Another
                  </Button>
                </div>
              </div>
            )}

            {listingStatus === "failed" && (
              <div className="animate-in fade-in zoom-in duration-500">
                <div className="flex justify-center mb-6">
                  <div className="relative p-6 rounded-full bg-gradient-to-br from-red-500/20 to-red-500/10 border-2 border-red-500/30">
                    <XCircle className="h-16 w-16 text-red-600 animate-in zoom-in duration-300" strokeWidth={2.5} />
                  </div>
                </div>
                
                <h2 className="text-3xl font-bold text-red-600 mb-3">
                  Listing Failed
                </h2>
                <p className="text-lg text-muted-foreground mb-2">
                  Oops! Something went wrong while creating your listing.
                </p>
                <p className="text-sm text-muted-foreground">
                  Please check your information and try again.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-6">
                  <Button 
                    onClick={() => {
                      setStep(2);
                      setListingStatus("idle");
                      setCreatedListingId(null);
                    }}
                    size="lg"
                    variant="default"
                    className="font-semibold group"
                  >
                    <RotateCcw className="mr-2 h-4 w-4 group-hover:rotate-180 transition-transform duration-500" />
                    Try Again
                  </Button>
                  <Button 
                    variant="outline"
                    size="lg"
                    onClick={() => {
                      setStep(0);
                      setProductId(null);
                      setType(null);
                      setListingStatus("idle");
                      setCreatedListingId(null);
                    }}
                    className="font-semibold"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Start Over
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      );
    }

    return null;
  };

  const getProgressValue = () => {
    if (step === 0) return 0;
    if (step === 1) return 33;
    if (step === 2) return 66;
    if (step === 3 && listingStatus !== "idle" && listingStatus !== "creating") return 100;
    return 66;
  };

  // Show loading while checking Stripe account
  if (isLoadingStripe) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <Card className="w-full sm:max-w-md">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
              <h2 className="text-lg font-semibold">Checking account status...</h2>
              <p className="text-muted-foreground text-sm">Please wait while we verify your payment information.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show Stripe onboarding prompt if no account connected
  if (!stripeAccount || stripeError) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <Card className="w-full sm:max-w-md">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <div className="rounded-full h-16 w-16 bg-primary/10 flex items-center justify-center">
                <CreditCard className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-center text-2xl">Connect Your Payment Account</CardTitle>
            <CardDescription className="text-center">
              To create listings and receive payments, you need to connect your Stripe account first.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">Why do I need this?</p>
                  <p className="text-sm text-muted-foreground">
                    Stripe securely handles all payments between buyers and sellers. You'll need to provide your payment information to receive earnings from your sales.
                  </p>
                </div>
              </div>
            </div>
            <Button 
              className="w-full" 
              size="lg"
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
            <Button 
              variant="ghost" 
              className="w-full"
              onClick={() => navigate('/settings')}
            >
              Go to Settings
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[80vh] p-4">
      <div className="w-full sm:max-w-2xl space-y-4">
        
        {/* Selected Product Card - Show on steps 1, 2, 3 */}
        {productId && selectedProduct && step > 0 && step < 3 && (
          <Card className="border-2 border-primary/20 bg-primary/5 hover:shadow-md transition-all duration-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  {selectedProduct.images.length > 0 ? (
                    <img 
                      src={selectedProduct.images.filter(img => img.isPrimary)[0]?.imageUri} 
                      alt={selectedProduct.title}
                      className="w-16 h-16 object-cover rounded-lg border-2 border-primary/20"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-muted rounded-lg border-2 border-primary/20 flex items-center justify-center">
                      <Package className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{selectedProduct.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Selected Product</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive flex-shrink-0"
                      onClick={handleRemoveProduct}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  {type && (
                    <Badge variant="secondary" className="mt-2 text-xs">
                      {type === 'fixed' ? 'Fixed Price' : 'Auction'}
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="w-full">
          {/* Progress Bar */}
          <Progress value={getProgressValue()} className="rounded-t-lg" />
          
          {/* Header with step indicator */}
          {step < 3 && (
            <CardHeader className="border-b bg-muted/30">
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <CardTitle className="text-lg">
                    {step === 0 && 'Select or Create Product'}
                    {step === 1 && 'Choose Listing Type'}
                    {step === 2 && `Create ${type === 'fixed' ? 'Fixed Price' : 'Auction'} Listing`}
                  </CardTitle>
                  <CardDescription className="text-xs mt-1">
                    Step {step + 1} of 3
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {step > 0 && step < 3 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleBack}
                      className="gap-1"
                    >
                      <ArrowLeft className="h-3 w-3" />
                      Back
                    </Button>
                  )}
                  {step < 3 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCancel}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
          )}
          
          {renderStepContent()}
        </Card>

        {/* Cancel Confirmation Dialog */}
        <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cancel Listing Creation?</DialogTitle>
              <DialogDescription>
                Are you sure you want to cancel? All your progress will be lost.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
                Continue Editing
              </Button>
              <Button variant="destructive" onClick={confirmCancel}>
                Yes, Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, Link, Navigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "../components/ui/card";
import { ChevronDownIcon } from "lucide-react";
import { Progress } from "@/components/ui/progress";
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
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            {listingStatus === "creating" && (
              <>
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
                <h2 className="text-lg font-semibold">Creating Listing...</h2>
                <p className="text-muted-foreground">Please wait while we create your listing.</p>
              </>
            )}

            {listingStatus === "success" && (
              <>
                <div className="flex justify-center">
                  <div className="rounded-full h-12 w-12 bg-green-100 flex items-center justify-center">
                    <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <h2 className="text-lg font-semibold text-green-600">Listing Created Successfully!</h2>
                <p className="text-muted-foreground">Your listing is now active.</p>
                <div className="flex gap-2 justify-center pt-4">
                  <Button onClick={() => navigate("/listings")}>View Listings</Button>
                  <Button variant="outline" onClick={() => {
                    setStep(0);
                    setProductId(null);
                    setType(null);
                    setListingStatus("idle");
                    setCreatedListingId(null);
                  }}>
                    Create Another
                  </Button>
                </div>
              </>
            )}

            {listingStatus === "failed" && (
              <>
                <div className="flex justify-center">
                  <div className="rounded-full h-12 w-12 bg-red-100 flex items-center justify-center">
                    <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                </div>
                <h2 className="text-lg font-semibold text-destructive">Failed to Create Listing</h2>
                <p className="text-muted-foreground">Something went wrong. Please try again.</p>
                <div className="flex gap-2 justify-center pt-4">
                  <Button onClick={() => {
                    setStep(2);
                    setListingStatus("idle");
                    setCreatedListingId(null);
                  }}>
                    Try Again
                  </Button>
                  <Button variant="outline" onClick={() => {
                    setStep(0);
                    setProductId(null);
                    setType(null);
                    setListingStatus("idle");
                    setCreatedListingId(null);
                  }}>
                    Start Over
                  </Button>
                </div>
              </>
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

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <Card className="w-full sm:max-w-md">
        <Progress value={getProgressValue()} />
        {renderStepContent()}
      </Card>
    </div>
  );
};
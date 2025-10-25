import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, Link, Navigate } from "react-router-dom";
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
import { useEffect, useState } from "react";
import ProductCard from "../components/CreateItem/ProductCard";
import { useCreateListing, useListingStatus, useProduct } from "../hooks/useProducts";

export const CreateItemPage = () => {
  const [step, setStep] = useState(0);
  const [productId, setProductId] = useState(null);
  const [type, setType] = useState(null);
  const [listingStatus, setListingStatus] = useState("idle"); // 'idle' | 'creating' | 'success' | 'failed'
  
  const { mutate } = useCreateListing();
  const { user } = useAuth();
  const userId = user?.userId;
  const navigate = useNavigate();

  // only enable polling when we're creating and haven't reached a final state
  const shouldPoll = listingStatus === "creating";
  // const { data, isLoading, isError } = useListingStatus(productId, {
  //   enabled: shouldPoll && !!productId,
  //   refetchInterval: shouldPoll ? 2000 : false, // poll every 2 seconds when creating
  // }); TODO: figure out after handling idempotency

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
    setListingStatus("creating");
    console.log("Create Item Data:", { productId, userId, type, ...data });

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

    mutate(payload);
  };

  // Monitor listing status changes
  // useEffect(() => {
  //   if (!data || listingStatus !== "creating") return;

  //   console.log("Status update:", data);

  //   if (data === "ACTIVE") {
  //     setListingStatus("success");
  //   } else if (data === "FAILED") {
  //     setListingStatus("failed");
  //   }
  // }, [data, listingStatus]);

  const renderStepContent = () => {
    // Steps 0-2: Form steps
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
        return <CreateAuctionForm onSubmit={onSubmit} />;
      }
    }

    // Step 3+: Status steps
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
                {/* {isError && (
                  <p className="text-destructive text-sm">Error checking status. Retrying...</p>
                )} */}
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
                  }}>
                    Try Again
                  </Button>
                  <Button variant="outline" onClick={() => {
                    setStep(0);
                    setProductId(null);
                    setType(null);
                    setListingStatus("idle");
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
    if (step === 3 && listingStatus === "success") return 100;
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
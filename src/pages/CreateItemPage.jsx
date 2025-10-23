import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter} from '../components/ui/card';
import { ChevronDownIcon } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import ProductSelectionStep from '../components/CreateItem/ProductSelectionStep';
import ListingTypeStep from '../components/CreateItem/ListingTypeStep';
import CreateFixedPriceForm from '../components/CreateItem/CreateFixedPriceForm';
import reateAuctionForm  from '../components/CreateItem/CreateAuctionForm';
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
import { useState } from 'react';
import ProductCard from '../components/CreateItem/ProductCard';
import CreateAuctionForm from '../components/CreateItem/CreateAuctionForm';

export const CreateItemPage = () => {
  const [step, setStep] = useState(0);
  const [productId, setProductId] = useState(null);
  const [type, setType] = useState(null);

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

  const handleListingTypeSelected = (type) => {
    console.log("Listing type selected:", type);
    setType(type);
    setStep(2);
  };

  const onSubmit = async (data) => {
    setStep(3);
    console.log("Create Item Data:", { productId, type, ...data });
    // TODO: Submit create item data
  };
  



  const navigate = useNavigate();
  const { register: registerAuth } = useAuth();

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <Card className="w-full sm:max-w-md">
        <Progress value={step * 33} />
        {step === 0 && (
          <ProductSelectionStep
            onSelect={handleProductSelected}
            onCreate={handleProductCreated}
          />
        )}

        {step === 1 && (
          <ListingTypeStep
            onSelect={handleListingTypeSelected}
          />
        )}

        {step === 2 && type === 'fixed' && (
          <CreateFixedPriceForm onSubmit={onSubmit} />
        )}

        {step === 2 && type === 'auction' && (
          <CreateAuctionForm onSubmit={onSubmit} />
        )}

        {step === 3 && (
          // TODO add loading then success or failure message
          // the following is just a placeholder
          <div className="p-4 text-center">
            <h2 className="text-lg font-medium mb-2">Creating Listing...</h2>
            <p>Please wait while we create your listing.</p>
          </div>
        )}

        
      </Card>
    </div>
  );
};
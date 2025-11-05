import React, { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateProduct, useCategories } from "../../hooks/useProducts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { v4 as uuidv4 } from "uuid";
import { Package, FileText, Tag, Plus, Loader2, Image as ImageIcon, X } from "lucide-react";
import imageCompression from 'browser-image-compression';
import { toast } from "sonner";


const productSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  categoryId: z.number().min(1, "Category is required"),
});

const CreateProductModal = ({ open, onCreate, onClose }) => {
  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [isCompressing, setIsCompressing] = useState(false);
  
  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isValid },
  } = useForm({
    resolver: zodResolver(productSchema),
    mode: "onChange",
    defaultValues: {
      title: "",
      description: "",
      categoryId: 0,
    },
  });

  const title = watch("title");
  const description = watch("description");

  const idempotencyKeyRef = useRef(null);

  const { mutate: createProduct, isPending } = useCreateProduct({
    onSuccess: (response) => {
      console.log("Product created successfully:", response);
      idempotencyKeyRef.current = null;
      reset();
      onCreate(response.productId);
      onClose();
    },
    onError: (error) => {
      console.error("Error creating product:", error);
      toast.error("Failed to create product", {
        description: "Please try again."
      });
    },
  });

  const { data: categories, isLoading: isCategoryLoading } = useCategories();

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      reset();
      idempotencyKeyRef.current = null;
      setSelectedImages([]);
      setImagePreviews([]);
    }
  }, [open, reset]);

  const handleImageChange = async (e) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length + selectedImages.length > 10) {
      toast.error("Too many images", {
        description: "Maximum 10 images allowed"
      });
      return;
    }
    
    setIsCompressing(true);
    
    try {
      // Compression options
      const options = {
        maxSizeMB: 1, // Maximum file size in MB
        maxWidthOrHeight: 1920, // Max width or height
        useWebWorker: true, // Use web worker for better performance
        fileType: 'image/jpeg', // Convert to JPEG for better compression
      };
      
      // Compress all images
      const compressedFiles = await Promise.all(
        files.map(async (file) => {
          try {
            const compressedFile = await imageCompression(file, options);
            console.log(`Original: ${(file.size / 1024 / 1024).toFixed(2)}MB -> Compressed: ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);
            return compressedFile;
          } catch (error) {
            console.error('Error compressing image:', error);
            return file; // Use original if compression fails
          }
        })
      );
      
      setSelectedImages(prev => [...prev, ...compressedFiles]);
      
      // Create preview URLs
      compressedFiles.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreviews(prev => [...prev, reader.result]);
        };
        reader.readAsDataURL(file);
      });
    } catch (error) {
      console.error('Error processing images:', error);
      toast.error("Failed to process images", {
        description: "Please try again."
      });
    } finally {
      setIsCompressing(false);
    }
  };

  const removeImage = (index) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = (data) => {
    console.log("Submitting form with data:", data);

    if (!idempotencyKeyRef.current) {
      idempotencyKeyRef.current = uuidv4();
      console.log("Generated Idempotency-Key:", idempotencyKeyRef.current);
    }

    createProduct({ 
      data: {
        ...data,
        images: selectedImages,
      }, 
      idempotencyKey: idempotencyKeyRef.current 
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <div className="p-2 rounded-lg bg-primary/10">
                <Package className="h-5 w-5 text-primary" />
              </div>
              Create New Product
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-1">
            <FieldGroup className="space-y-5 py-6">
            {/* Title */}
            <Controller
              name="title"
              control={control}
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor="title" className="text-sm font-semibold flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-blue-500/10">
                      <Package className="h-4 w-4 text-blue-600" />
                    </div>
                    Product Title
                  </FieldLabel>
                  <Input
                    {...field}
                    id="title"
                    placeholder="e.g., Vintage Camera Collection"
                    autoComplete="off"
                    className={`h-11 ${errors.title ? 'border-red-500' : ''}`}
                  />
                  {errors.title && (
                    <FieldError className="flex items-center gap-1 animate-in slide-in-from-top-1">
                      <span className="inline-block w-1 h-1 rounded-full bg-red-600" />
                      {errors.title.message}
                    </FieldError>
                  )}
                  {title && !errors.title && (
                    <p className="text-xs text-muted-foreground">{title.length} characters</p>
                  )}
                </Field>
              )}
            />

            {/* Description */}
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor="description" className="text-sm font-semibold flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-purple-500/10">
                      <FileText className="h-4 w-4 text-purple-600" />
                    </div>
                    Description
                  </FieldLabel>
                  <Textarea
                    {...field}
                    id="description"
                    placeholder="Describe your product in detail..."
                    rows={4}
                    className={errors.description ? 'border-red-500' : ''}
                  />
                  {errors.description && (
                    <FieldError className="flex items-center gap-1 animate-in slide-in-from-top-1">
                      <span className="inline-block w-1 h-1 rounded-full bg-red-600" />
                      {errors.description.message}
                    </FieldError>
                  )}
                  {description && !errors.description && (
                    <p className="text-xs text-muted-foreground">{description.length} characters</p>
                  )}
                </Field>
              )}
            />

            {/* Category */}
            <Controller
              name="categoryId"
              control={control}
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor="category" className="text-sm font-semibold flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-green-500/10">
                      <Tag className="h-4 w-4 text-green-600" />
                    </div>
                    Category
                  </FieldLabel>
                  <Select
                    value={field.value ? String(field.value) : ""}
                    onValueChange={(val) => field.onChange(Number(val))}
                    disabled={isCategoryLoading}
                  >
                    <SelectTrigger id="category" className={`h-11 ${errors.categoryId ? 'border-red-500' : ''}`}>
                      <SelectValue placeholder="Choose a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories?.map((category) => (
                        <SelectItem key={category.categoryId} value={String(category.categoryId)}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.categoryId && (
                    <FieldError className="flex items-center gap-1 animate-in slide-in-from-top-1">
                      <span className="inline-block w-1 h-1 rounded-full bg-red-600" />
                      {errors.categoryId.message}
                    </FieldError>
                  )}
                </Field>
              )}
            />

            {/* Image Upload */}
            <Field>
              <FieldLabel className="text-sm font-semibold flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-blue-500/10">
                  <ImageIcon className="h-4 w-4 text-blue-600" />
                </div>
                Product Images <span className="text-xs font-normal text-muted-foreground">(Optional, max 10)</span>
              </FieldLabel>
              
              <div className="space-y-3">
                {/* Image Previews */}
                {imagePreviews.length > 0 && (
                  <div className="grid grid-cols-4 gap-2">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative group">
                        <img 
                          src={preview} 
                          alt={`Preview ${index + 1}`}
                          className="w-full aspect-square object-cover rounded-lg border-2 border-border"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 p-1 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Upload Button */}
                {selectedImages.length < 10 && (
                  <label className={`flex items-center justify-center gap-2 h-24 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors ${isCompressing ? 'opacity-50 pointer-events-none' : ''}`}>
                    {isCompressing ? (
                      <>
                        <Loader2 className="h-5 w-5 text-primary animate-spin" />
                        <span className="text-sm text-muted-foreground">
                          Compressing images...
                        </span>
                      </>
                    ) : (
                      <>
                        <ImageIcon className="h-5 w-5 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          Click to upload images
                        </span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageChange}
                      className="hidden"
                      disabled={isCompressing}
                    />
                  </label>
                )}
                
                <p className="text-xs text-muted-foreground">
                  {selectedImages.length}/10 images selected • Images are automatically compressed
                </p>
              </div>
            </Field>
          </FieldGroup>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 flex-shrink-0 pt-4 border-t">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose} 
              disabled={isPending}
              className="h-11"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isPending || !isValid}
              className="h-11 font-semibold"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Product
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateProductModal;
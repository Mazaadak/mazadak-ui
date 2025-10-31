import { useState, useRef } from 'react';
import { useUploadPersonalPhoto } from '../hooks/useUsers';
import { useAuth } from '../contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Upload, User, Loader2, CheckCircle, X, ImageIcon } from 'lucide-react';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from './ui/field';

export const UpdatePhotoDialog = ({ open, onOpenChange }) => {
  const { user, refreshUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const uploadPhotoMutation = useUploadPersonalPhoto();

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    processFile(file);
  };

  const processFile = (file) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (JPG, PNG, GIF)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setError('');
    setSelectedFile(file);

    // Create preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    processFile(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedFile) {
      setError('Please select a photo to upload');
      return;
    }

    if (!user?.userId) {
      console.error('No user ID available');
      return;
    }

    setIsSubmitting(true);

    try {
      await uploadPhotoMutation.mutateAsync({
        userId: user.userId,
        file: selectedFile,
      });

      // Show success state
      setShowSuccess(true);

      // Refresh user context
      if (refreshUser) {
        await refreshUser();
      }

      // Close dialog after short delay
      setTimeout(() => {
        onOpenChange(false);
        handleReset();
        setShowSuccess(false);
      }, 1500);
    } catch (error) {
      console.error('Error uploading photo:', error);
      setError('Failed to upload photo. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleOpenChange = (newOpen) => {
    if (!newOpen && !isSubmitting) {
      handleReset();
      setShowSuccess(false);
    }
    onOpenChange(newOpen);
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name[0].toUpperCase();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Update Profile Photo</DialogTitle>
          <DialogDescription className="text-base">
            Upload a new profile photo. Maximum file size is 5MB.
          </DialogDescription>
        </DialogHeader>

        {showSuccess ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="relative mb-4">
              <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl animate-pulse" />
              <CheckCircle className="relative h-16 w-16 text-green-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Photo Updated!</h3>
            <p className="text-muted-foreground">Your profile photo has been updated successfully.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 py-4">
            <div className="flex flex-col items-center gap-6">
              {/* Preview Avatar */}
              <div className="relative group">
                <Avatar className="h-36 w-36 border-4 border-border shadow-xl">
                  <AvatarImage 
                    src={previewUrl || user?.personalPhoto} 
                    alt={user?.name || 'Profile'} 
                  />
                  <AvatarFallback className="text-4xl bg-muted">
                    {user?.name ? getInitials(user.name) : <User className="h-16 w-16" />}
                  </AvatarFallback>
                </Avatar>
                {selectedFile && (
                  <button
                    type="button"
                    onClick={handleReset}
                    className="absolute -top-2 -right-2 p-2 bg-destructive text-destructive-foreground rounded-full shadow-lg hover:scale-110 transition-transform"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Drag and Drop Area */}
              <div 
                className={`w-full border-2 border-dashed rounded-xl p-8 transition-all ${
                  isDragging 
                    ? 'border-primary bg-primary/10' 
                    : 'border-border hover:border-primary/50 hover:bg-muted/50'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className="p-4 bg-primary/10 rounded-full">
                    <ImageIcon className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <p className="text-base font-medium mb-1">
                      Drag and drop your photo here
                    </p>
                    <p className="text-sm text-muted-foreground mb-4">
                      or click the button below to browse
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    id="photo-upload"
                    disabled={isSubmitting}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isSubmitting}
                    className="mt-2"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Choose Photo
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    JPG, PNG or GIF • Max 5MB
                  </p>
                </div>
              </div>

              {selectedFile && !error && (
                <div className="w-full p-3 bg-primary/10 border border-primary/20 rounded-lg">
                  <p className="text-sm font-medium text-primary">
                    ✓ {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                  </p>
                </div>
              )}

              {error && (
                <div className="w-full p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-sm font-medium text-destructive">{error}</p>
                </div>
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || !selectedFile}
                className="min-w-[120px]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Photo
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

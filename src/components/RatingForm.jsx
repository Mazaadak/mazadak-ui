import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Star, Edit2 } from 'lucide-react';
import { useCreateRating, useUpdateRating } from '../hooks/useProducts';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

export const RatingForm = ({ productId, userId, existingRatings = [], onSuccess, triggerEdit = false }) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editingRatingId, setEditingRatingId] = useState(null);
  const { user } = useAuth();
  
  const createRating = useCreateRating();
  const updateRating = useUpdateRating();

  // Check if user already has a review
  const userExistingReview = existingRatings.find(r => r.userId === userId);

  // Update editing state when user's review changes
  useEffect(() => {
    if (userExistingReview && !isEditing) {
      // Track that review exists
      setEditingRatingId(userExistingReview.ratingId);
      // Reset form if we're not currently editing
      setRating(0);
      setReviewText('');
    } else if (!userExistingReview && editingRatingId) {
      // Review was deleted, reset
      setEditingRatingId(null);
      setRating(0);
      setReviewText('');
      setIsEditing(false);
    }
  }, [userExistingReview, isEditing, editingRatingId]);

  // Handle external edit trigger
  useEffect(() => {
    if (triggerEdit && userExistingReview && !isEditing) {
      setRating(userExistingReview.rating);
      setReviewText(userExistingReview.reviewText || '');
      setIsEditing(true);
    }
  }, [triggerEdit, userExistingReview, isEditing]);

  const handleEdit = () => {
    if (userExistingReview) {
      setRating(userExistingReview.rating);
      setReviewText(userExistingReview.reviewText || '');
      setIsEditing(true);
    }
  };

  const handleCancel = () => {
    setRating(0);
    setReviewText('');
    setIsEditing(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    try {
      if (isEditing && editingRatingId) {
        await updateRating.mutateAsync({
          ratingId: editingRatingId,
          data: {
            rating,
            reviewText,
          }
        });
        toast.success('Review updated successfully!');
      } else {
        await createRating.mutateAsync({
          productId,
          data: {
            rating,
            reviewText,
          }
        });
        toast.success('Review submitted successfully!');
      }
      
      // Reset form
      setRating(0);
      setReviewText('');
      setIsEditing(false);
      
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Failed to submit rating:', error);
      toast.error(isEditing ? 'Failed to update review' : 'Failed to submit review');
    }
  };

  if (!user) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p className="mb-3">Please log in to leave a review</p>
      </div>
    );
  }

  // If user has already reviewed and not editing, show message
  if (userExistingReview && !isEditing) {
    return (
      <div className="text-center py-6">
        <div className="mb-4">
          <div className="flex items-center justify-center gap-1 mb-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-5 w-5 ${
                  star <= userExistingReview.rating
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-muted-foreground mb-3">You've already reviewed this product</p>
        </div>
        <Button 
          variant="outline" 
          onClick={handleEdit}
          className="w-full"
        >
          <Edit2 className="h-4 w-4 mr-2" />
          Edit Your Review
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label className="text-center block">
          {isEditing ? 'Update Your Rating' : 'Your Rating'}
        </Label>
        <div className="flex items-center justify-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className="transition-transform hover:scale-110"
            >
              <Star
                className={`h-8 w-8 ${
                  star <= (hoveredRating || rating)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            </button>
          ))}
        </div>
        {rating > 0 && (
          <p className="text-sm text-muted-foreground text-center">
            {rating} out of 5 stars
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="review">Your Review (Optional)</Label>
        <Textarea
          id="review"
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          placeholder="Share your thoughts about this product..."
          rows={4}
        />
      </div>

      <div className="flex gap-2">
        {isEditing && (
          <Button 
            type="button"
            variant="outline"
            onClick={handleCancel}
            className="flex-1"
          >
            Cancel
          </Button>
        )}
        <Button 
          type="submit" 
          disabled={createRating.isPending || updateRating.isPending || rating === 0}
          className="flex-1"
        >
          {createRating.isPending || updateRating.isPending 
            ? (isEditing ? 'Updating...' : 'Submitting...') 
            : (isEditing ? 'Update Review' : 'Submit Review')}
        </Button>
      </div>
    </form>
  );
};
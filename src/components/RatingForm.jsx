import { useState } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Star } from 'lucide-react';
import { useCreateRating } from '../hooks/useRatings';
import { useAuth } from '../contexts/AuthContext';

export const RatingForm = ({ productId, onSuccess }) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const { user } = useAuth();
  
  const createRating = useCreateRating();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      alert('Please select a rating');
      return;
    }

    try {
      await createRating.mutateAsync({
        productId,
        data: {
          rating,
          reviewText,
        }
      });
      
      // Reset form
      setRating(0);
      setReviewText('');
      
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Failed to submit rating:', error);
    }
  };

  if (!user) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        Please log in to leave a review
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Your Rating</Label>
        <div className="flex items-center gap-1">
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
          {rating > 0 && (
            <span className="ml-2 text-sm text-muted-foreground">
              {rating} out of 5 stars
            </span>
          )}
        </div>
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

      <Button 
        type="submit" 
        disabled={createRating.isPending || rating === 0}
        className="w-full"
      >
        {createRating.isPending ? 'Submitting...' : 'Submit Review'}
      </Button>

      {createRating.isError && (
        <p className="text-sm text-destructive">
          Failed to submit review. Please try again.
        </p>
      )}
    </form>
  );
};
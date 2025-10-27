import { Star, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Separator } from './ui/separator';
import { useAuth } from '../contexts/AuthContext';
import { useDeleteRating } from '../hooks/useRatings';

export const RatingList = ({ ratings, isLoading }) => {
  const { user } = useAuth();
  const deleteRating = useDeleteRating();

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="pt-6">
              <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
              <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
              <div className="h-16 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!ratings || ratings.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No reviews yet. Be the first to review this product!</p>
      </div>
    );
  }

  const handleDelete = async (ratingId) => {
    if (window.confirm('Are you sure you want to delete this review?')) {
      try {
        await deleteRating.mutateAsync(ratingId);
      } catch (error) {
        console.error('Failed to delete rating:', error);
      }
    }
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating
            ? 'fill-yellow-400 text-yellow-400'
            : 'text-gray-300'
        }`}
      />
    ));
  };

const formatDate = (input) => {
  if (input == null || input === '') return '';

  if (Array.isArray(input)) {
    const [y, mo, da, hh = 0, mm = 0, ss = 0, nanos = 0] = input.map((v) => Number(v));
    if (![y, mo, da].every(Number.isFinite)) return '';
    const ms = Math.floor((Number(nanos) || 0) / 1e6);
    const d = new Date(y, (mo || 1) - 1, da, hh || 0, mm || 0, ss || 0, ms);
    if (isNaN(d)) return '';
    return d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  return '';
};

  return (
    <div className="space-y-4">
      {ratings.map((rating) => {
        const isOwnRating = user?.userId === rating.userId;
        
        return (
          <Card key={rating.ratingId}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex items-center gap-1">
                      {renderStars(rating.rating)}
                    </div>
                    <span className="font-medium">{rating.rating}/5</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(rating.createdAt)}
                  </p>
                </div>
                
                {isOwnRating && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(rating.ratingId)}
                    disabled={deleteRating.isPending}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>

              {rating.reviewText && (
                <>
                  <Separator className="my-3" />
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {rating.reviewText}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
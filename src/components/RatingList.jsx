import { Star, Trash2, Edit2, User } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Separator } from './ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { useAuth } from '../contexts/AuthContext';
import { useDeleteRating } from '../hooks/useProducts';
import { useUser } from '../hooks/useUsers';
import { useState } from 'react';

const RatingItem = ({ rating, currentUserId, onEdit }) => {
  const { data: reviewer, isLoading: reviewerLoading } = useUser(rating.userId);
  const deleteRating = useDeleteRating();
  const isOwnRating = currentUserId === rating.userId;
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDelete = async () => {
    try {
      await deleteRating.mutateAsync(rating.ratingId);
      setShowDeleteDialog(false);
    } catch (error) {
      console.error('Failed to delete rating:', error);
    }
  };

  const renderStars = (ratingValue) => {
    return (
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${
              i < ratingValue
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
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
    <Card className="transition-all hover:shadow-md">
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          {/* Reviewer Avatar and Info */}
          <div className="flex flex-col items-center gap-2 min-w-[80px]">
            {reviewerLoading ? (
              <div className="h-12 w-12 bg-muted rounded-full animate-pulse" />
            ) : (
              <Avatar className="h-12 w-12">
                <AvatarImage src={reviewer?.personalPhoto} alt={reviewer?.name} />
                <AvatarFallback className="bg-primary/10">
                  <User className="h-6 w-6" />
                </AvatarFallback>
              </Avatar>
            )}
            {reviewerLoading ? (
              <div className="h-4 w-16 bg-muted rounded animate-pulse" />
            ) : (
              <p className="text-sm font-medium text-center">{reviewer?.name || 'Anonymous'}</p>
            )}
          </div>

          {/* Review Content */}
          <div className="flex-1">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                {renderStars(rating.rating)}
                <p className="text-sm text-muted-foreground mt-1 text-left">
                  {formatDate(rating.createdAt)}
                </p>
              </div>

              {/* Action Buttons */}
              {isOwnRating && (
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(rating)}
                    className="hover:bg-primary/10"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowDeleteDialog(true)}
                    disabled={deleteRating.isPending}
                    className="hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              )}
            </div>

            {rating.reviewText && (
              <>
                <Separator className="my-3" />
                <p className="text-sm leading-relaxed whitespace-pre-wrap text-left">
                  {rating.reviewText}
                </p>
              </>
            )}
          </div>
        </div>
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Review</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this review? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={deleteRating.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteRating.isPending}
            >
              {deleteRating.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export const RatingList = ({ ratings, isLoading, currentUserId, onEdit }) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 bg-muted rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
                  <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
                  <div className="h-16 bg-muted rounded"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!ratings || ratings.length === 0) {
    return null; // Handled by parent component
  }

  return (
    <div className="space-y-4">
      {ratings.map((rating) => (
        <RatingItem
          key={rating.ratingId}
          rating={rating}
          currentUserId={currentUserId}
          onEdit={onEdit}
        />
      ))}
    </div>
  );
};
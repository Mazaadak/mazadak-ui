import { useState } from 'react';
import { usePlaceBid } from '../../hooks/useAuctions';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent } from '../ui/card';
import { AlertCircle, Gavel, Check } from 'lucide-react';
import { calculateMinimumBid, validateBidAmount, generateIdempotencyKey, formatCurrency } from '../../lib/auctionUtils';

export const BidForm = ({ auction, userId, onSuccess }) => {
  const [bidAmount, setBidAmount] = useState('');
  const [error, setError] = useState('');
  
  const placeBid = usePlaceBid();
  const minBid = calculateMinimumBid(auction);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    // Validate bid amount
    const validation = validateBidAmount(bidAmount, auction);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    // Place bid
    const idempotencyKey = generateIdempotencyKey();
    placeBid.mutate(
      {
        auctionId: auction.id,
        bidData: {
          bidderId: userId,
          amount: Number(bidAmount),
        },
        idempotencyKey,
      },
      {
        onSuccess: () => {
          setBidAmount('');
          onSuccess?.();
        },
        onError: (err) => {
          // Handle ProblemDetails error
          const errorMessage = err?.response?.data?.detail || err?.message || 'Failed to place bid';
          setError(errorMessage);
        },
      }
    );
  };

  const handleQuickBid = () => {
    setBidAmount(minBid.toString());
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="bidAmount" className="text-base font-semibold">
              Place Your Bid
            </Label>
            <p className="text-sm text-muted-foreground mt-1 mb-3">
              Minimum bid: {formatCurrency(minBid)}
            </p>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  id="bidAmount"
                  type="number"
                  step="0.01"
                  min={minBid}
                  placeholder={`Enter bid amount (min $${minBid.toFixed(2)})`}
                  value={bidAmount}
                  onChange={(e) => {
                    setBidAmount(e.target.value);
                    setError('');
                  }}
                  disabled={placeBid.isPending}
                  className="text-lg"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleQuickBid}
                disabled={placeBid.isPending}
              >
                Min Bid
              </Button>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 bg-destructive/10 text-destructive rounded-md">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {placeBid.isSuccess && !error && (
            <div className="flex items-start gap-2 p-3 bg-green-500/10 text-green-600 rounded-md">
              <Check className="h-4 w-4 mt-0.5 shrink-0" />
              <p className="text-sm">Bid placed successfully!</p>
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={placeBid.isPending || !bidAmount}
          >
            <Gavel className="mr-2 h-5 w-5" />
            {placeBid.isPending ? 'Placing Bid...' : 'Place Bid'}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            By placing a bid, you agree to purchase this item if you win.
          </p>
        </form>
      </CardContent>
    </Card>
  );
};

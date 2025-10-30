import { useState, useEffect } from 'react';
import { useCreateOrUpdateProxyBid, useProxyBid, useDeleteProxyBid } from '../../hooks/useAuctions';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { AlertCircle, TrendingUp, Check, Trash2 } from 'lucide-react';
import { calculateMinimumBid, formatCurrency } from '../../lib/auctionUtils';

export const ProxyBidForm = ({ auction, userId }) => {
  const [maxAmount, setMaxAmount] = useState('');
  const [error, setError] = useState('');
  
  const createOrUpdateProxyBid = useCreateOrUpdateProxyBid();
  const deleteProxyBid = useDeleteProxyBid();
  const { data: existingProxyBid, isLoading: isLoadingProxyBid } = useProxyBid(auction.id, userId);
  
  const minBid = calculateMinimumBid(auction);

  useEffect(() => {
    if (existingProxyBid?.maxAmount) {
      setMaxAmount(existingProxyBid.maxAmount.toString());
    }
  }, [existingProxyBid]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const numMaxAmount = Number(maxAmount);

    // Validate max amount
    if (isNaN(numMaxAmount) || numMaxAmount <= 0) {
      setError('Max amount must be a positive number');
      return;
    }

    if (numMaxAmount < minBid) {
      setError(`Max amount must be at least ${formatCurrency(minBid)}`);
      return;
    }

    // Create or update proxy bid
    createOrUpdateProxyBid.mutate(
      {
        auctionId: auction.id,
        bidderId: userId,
        proxyBidData: {
          maxAmount: numMaxAmount,
        },
      },
      {
        onSuccess: () => {
          setError('');
        },
        onError: (err) => {
          const errorMessage = err?.response?.data?.detail || err?.message || 'Failed to set proxy bid';
          setError(errorMessage);
        },
      }
    );
  };

  const handleDelete = () => {
    deleteProxyBid.mutate(
      {
        auctionId: auction.id,
        bidderId: userId,
      },
      {
        onSuccess: () => {
          setMaxAmount('');
          setError('');
        },
        onError: (err) => {
          const errorMessage = err?.response?.data?.detail || err?.message || 'Failed to delete proxy bid';
          setError(errorMessage);
        },
      }
    );
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Automatic Bidding (Proxy Bid)
        </CardTitle>
        <CardDescription>
          Set your maximum bid and we'll automatically bid for you up to that amount
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="maxAmount">
              Maximum Bid Amount
            </Label>
            <p className="text-xs text-muted-foreground mt-1 mb-2">
              The system will automatically place bids on your behalf up to this amount
            </p>
            <Input
              id="maxAmount"
              type="number"
              step="0.01"
              min={minBid}
              placeholder={`Enter max amount (min $${minBid.toFixed(2)})`}
              value={maxAmount}
              onChange={(e) => {
                setMaxAmount(e.target.value);
                setError('');
              }}
              disabled={createOrUpdateProxyBid.isPending || deleteProxyBid.isPending || isLoadingProxyBid}
            />
          </div>

          {existingProxyBid && (
            <div className="flex items-start gap-2 p-3 bg-blue-500/10 text-blue-600 rounded-md">
              <Check className="h-4 w-4 mt-0.5 shrink-0" />
              <div className="text-sm">
                <p className="font-medium">Proxy bid active</p>
                <p className="text-xs mt-1">
                  Current max: {formatCurrency(existingProxyBid.maxAmount)}
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 p-3 bg-destructive/10 text-destructive rounded-md">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {createOrUpdateProxyBid.isSuccess && !error && (
            <div className="flex items-start gap-2 p-3 bg-green-500/10 text-green-600 rounded-md">
              <Check className="h-4 w-4 mt-0.5 shrink-0" />
              <p className="text-sm">
                {existingProxyBid ? 'Proxy bid updated!' : 'Proxy bid set successfully!'}
              </p>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              type="submit"
              className="flex-1"
              disabled={createOrUpdateProxyBid.isPending || deleteProxyBid.isPending || !maxAmount}
            >
              {createOrUpdateProxyBid.isPending
                ? 'Setting...'
                : existingProxyBid
                ? 'Update Proxy Bid'
                : 'Set Proxy Bid'}
            </Button>

            {existingProxyBid && (
              <Button
                type="button"
                variant="destructive"
                size="icon"
                onClick={handleDelete}
                disabled={deleteProxyBid.isPending || createOrUpdateProxyBid.isPending}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="text-xs text-muted-foreground space-y-1">
            <p>• The system will bid the minimum amount needed to keep you as the highest bidder</p>
            <p>• You'll only pay up to your maximum bid if needed</p>
            <p>• You can update or cancel your proxy bid at any time</p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

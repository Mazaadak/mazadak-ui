import { useState, useEffect } from 'react';
import { useCreateOrUpdateProxyBid, useProxyBid, useDeleteProxyBid } from '../../hooks/useAuctions';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { AlertCircle, TrendingUp, Check, Trash2 } from 'lucide-react';
import { calculateMinimumBid, formatCurrency } from '../../lib/auctionUtils';
import { getErrorMessage, getValidationErrors, isValidationError } from '../../lib/errorUtils';

export const ProxyBidForm = ({ auction, userId }) => {
  const [maxAmount, setMaxAmount] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
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
    setFieldErrors({});

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
          const message = existingProxyBid ? 'Proxy bid updated!' : 'Proxy bid set successfully!';
          setSuccessMessage(message);
          setShowSuccessAnimation(true);
          setTimeout(() => setShowSuccessAnimation(false), 3000);
        },
        onError: (err) => {
          // Handle validation errors (field-specific)
          if (isValidationError(err)) {
            const validationErrors = getValidationErrors(err);
            setFieldErrors(validationErrors);
            setError('Please correct the errors below.');
          } else {
            // Handle other errors (general message)
            const errorMessage = getErrorMessage(err);
            setError(errorMessage);
          }
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
          setFieldErrors({});
          setShowSuccessAnimation(false);
          setSuccessMessage('');
        },
        onError: (err) => {
          const errorMessage = getErrorMessage(err);
          setError(errorMessage);
        },
      }
    );
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
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
                setFieldErrors({});
              }}
              disabled={createOrUpdateProxyBid.isPending || deleteProxyBid.isPending || isLoadingProxyBid}
              className={fieldErrors.maxAmount ? 'border-destructive focus-visible:ring-destructive' : ''}
            />
            {fieldErrors.maxAmount && (
              <p className="text-sm text-destructive mt-1.5 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {fieldErrors.maxAmount}
              </p>
            )}
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

          {showSuccessAnimation && (
            <div className="flex items-start gap-2 p-3 bg-green-500/10 text-green-600 rounded-md animate-in fade-in slide-in-from-bottom-4">
              <Check className="h-4 w-4 mt-0.5 shrink-0" />
              <p className="text-sm">{successMessage}</p>
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

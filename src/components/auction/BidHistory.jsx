import { useBids } from '../../hooks/useAuctions';
import { useUser } from '../../hooks/useUsers';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { Trophy, History, ChevronDown, User } from 'lucide-react';
import { formatCurrency, formatEgyptTime } from '../../lib/auctionUtils';
import { useState } from 'react';

const BidderInfo = ({ bidderId, isUserBid, isHighest }) => {
  const { data: user, isLoading } = useUser(bidderId);

  if (isLoading) {
    return <span className="text-sm text-muted-foreground">Loading...</span>;
  }

  // Prioritize: full name > first name > username > fallback
  const displayName = user?.name || 
                      (user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : null) ||
                      user?.firstName ||
                      user?.username || 
                      `Bidder ${bidderId.substring(0, 8)}`;
  const initials = displayName.substring(0, 2).toUpperCase();

  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 mb-1">
        <Avatar className="h-6 w-6">
          <AvatarImage src={user?.personalPhoto} alt={displayName} />
          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
        </Avatar>
        <span className="font-medium text-sm truncate">{displayName}</span>
        {isUserBid && (
          <Badge variant="outline" className="text-xs border-blue-500 text-blue-600">
            You
          </Badge>
        )}
        {isHighest && (
          <Badge className="text-xs bg-green-500">
            Winning
          </Badge>
        )}
      </div>
    </div>
  );
};

export const BidHistory = ({ auctionId, highestBidId, currentUserId }) => {
  const [pageSize, setPageSize] = useState(20); // Start with 20 bids

  const { data: bidsData, isLoading, error } = useBids(
    auctionId,
    { page: 0, size: pageSize, sort: 'amount,desc' },
    { enablePolling: true }
  );

  const bids = bidsData?.content || [];
  const totalBids = bidsData?.totalElements || 0;
  const hasMoreBids = bids.length < totalBids;

  // Debug: Log first bid to see the structure
  if (bids.length > 0 && process.env.NODE_ENV === 'development') {
    console.log('First bid structure:', bids[0]);
  }

  const loadMore = () => {
    setPageSize(prev => Math.min(prev + 20, 100)); // Load 20 more, max 100
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Bid History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Bid History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">Failed to load bid history</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Bid History
          </CardTitle>
          <Badge variant="secondary">
            {totalBids} {totalBids === 1 ? 'bid' : 'bids'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {bids.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No bids placed yet</p>
            <p className="text-sm mt-1">Be the first to bid!</p>
          </div>
        ) : (
          <div className="space-y-2">
            <ScrollArea className="h-[400px] pr-4">
              {bids.map((bid, index) => {
                const isHighest = bid.id === highestBidId;
                const isUserBid = bid.bidderId === currentUserId;
                
                return (
                  <div
                    key={bid.id}
                    className={`flex items-center justify-between p-3 rounded-lg border mb-2 transition-colors ${
                      isUserBid 
                        ? 'bg-blue-500/10 border-blue-500 border-l-4' 
                        : 'border-border'
                    } ${
                      isHighest ? 'bg-green-500/5 border-green-500/50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-semibold ${
                        isHighest ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'
                      }`}>
                        {isHighest ? <Trophy className="h-4 w-4" /> : `#${index + 1}`}
                      </div>
                      
                      <BidderInfo bidderId={bid.bidderId} isUserBid={isUserBid} isHighest={isHighest} />
                    </div>
                    
                    <div className="text-right">
                      <p className={`font-bold text-lg ${
                        isHighest ? 'text-green-600' : ''
                      }`}>
                        {formatCurrency(bid.amount)}
                      </p>
                      {bid.createdAt ? (
                        <p className="text-xs text-muted-foreground">
                          {formatEgyptTime(bid.createdAt, 'MMM dd, h:mm a')}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">
                          Time unavailable
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </ScrollArea>

            {/* Load More Button */}
            {hasMoreBids && (
              <div className="text-center pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={loadMore}
                  className="w-full"
                >
                  <ChevronDown className="mr-2 h-4 w-4" />
                  Load More Bids ({totalBids - bids.length} remaining)
                </Button>
              </div>
            )}
            
            {/* Max reached message */}
            {bids.length >= 100 && totalBids > 100 && (
              <p className="text-xs text-center text-muted-foreground pt-2">
                Showing most recent 100 bids
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

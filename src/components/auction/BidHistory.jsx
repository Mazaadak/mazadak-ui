import { useBids } from '../../hooks/useAuctions';
import { useUser } from '../../hooks/useUsers';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Trophy, History } from 'lucide-react';
import { formatCurrency, formatEgyptTime } from '../../lib/auctionUtils';

const BidderInfo = ({ bidderId, isHighest }) => {
  const { data: user, isLoading } = useUser(bidderId);

  if (isLoading) {
    return <span className="text-sm text-muted-foreground">Loading...</span>;
  }

  const displayName = user?.username || user?.email || `Bidder ${bidderId.substring(0, 8)}`;
  const initials = displayName.substring(0, 2).toUpperCase();

  return (
    <div className="flex items-center gap-2">
      <Avatar className="h-8 w-8">
        <AvatarImage src={user?.avatar} alt={displayName} />
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <div className="flex items-center gap-2">
        <span className="font-medium">{displayName}</span>
        {isHighest && (
          <Badge variant="default" className="text-xs">
            <Trophy className="h-3 w-3 mr-1" />
            Leading
          </Badge>
        )}
      </div>
    </div>
  );
};

export const BidHistory = ({ auctionId, highestBidId }) => {
  const { data: bidsData, isLoading, error } = useBids(
    auctionId,
    { page: 0, size: 10, sort: 'amount,desc' },
    { enablePolling: true }
  );

  const bids = bidsData?.content || [];

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
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Bid History
          {bids.length > 0 && (
            <Badge variant="secondary" className="ml-auto">
              {bids.length} {bids.length === 1 ? 'bid' : 'bids'}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {bids.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No bids placed yet</p>
            <p className="text-sm mt-1">Be the first to bid!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bidder</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bids.map((bid, index) => (
                  <TableRow key={bid.id} className={index === 0 ? 'bg-primary/5' : ''}>
                    <TableCell>
                      <BidderInfo bidderId={bid.bidderId} isHighest={bid.id === highestBidId} />
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(bid.amount)}
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {formatEgyptTime(bid.createdAt || new Date(), 'PPp')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

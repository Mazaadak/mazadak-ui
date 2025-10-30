import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { getTimeRemaining } from '../../lib/auctionUtils';
import { Badge } from '../ui/badge';

export const AuctionCountdown = ({ endTime, status, className = '' }) => {
  const [timeRemaining, setTimeRemaining] = useState(getTimeRemaining(endTime));

  useEffect(() => {
    if (status !== 'ACTIVE') return;

    const timer = setInterval(() => {
      const remaining = getTimeRemaining(endTime);
      setTimeRemaining(remaining);

      // Stop timer when auction ends
      if (remaining.total <= 0) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [endTime, status]);

  // Don't render anything if auction is cancelled
  if (status === 'CANCELLED') {
    return null;
  }

  if (status === 'ENDED') {
    return (
      <Badge variant="outline" className={`text-muted-foreground ${className}`}>
        <Clock className="mr-1 h-3 w-3" />
        Auction Ended
      </Badge>
    );
  }

  if (status === 'SCHEDULED') {
    return (
      <Badge variant="secondary" className={className}>
        <Clock className="mr-1 h-3 w-3" />
        Not Started
      </Badge>
    );
  }

  if (status === 'CANCELLED') {
    return (
      <Badge variant="destructive" className={className}>
        Cancelled
      </Badge>
    );
  }

  if (status === 'CANCELLED') {
    return (
      <Badge variant="destructive" className={className}>
        Cancelled
      </Badge>
    );
  }

  if (status === 'PAUSED') {
    return (
      <Badge variant="secondary" className={className}>
        Paused
      </Badge>
    );
  }

  const { days, hours, minutes, seconds, total } = timeRemaining;

  if (total <= 0) {
    return (
      <Badge variant="outline" className={`text-muted-foreground ${className}`}>
        <Clock className="mr-1 h-3 w-3" />
        Auction Ended
      </Badge>
    );
  }

  // Determine urgency color
  const isUrgent = total < 3600; // Less than 1 hour
  const isCritical = total < 300; // Less than 5 minutes

  const badgeVariant = isCritical ? 'destructive' : isUrgent ? 'default' : 'secondary';

  return (
    <Badge variant={badgeVariant} className={className}>
      <Clock className="mr-1 h-3 w-3" />
      {days > 0 && `${days}d `}
      {(days > 0 || hours > 0) && `${hours}h `}
      {(days > 0 || hours > 0 || minutes > 0) && `${minutes}m `}
      {seconds}s
    </Badge>
  );
};

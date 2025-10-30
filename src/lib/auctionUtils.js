import { format, formatDistanceToNow, differenceInSeconds } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

const EGYPT_TIMEZONE = 'Africa/Cairo';

/**
 * Convert UTC date to Egypt timezone
 */
export const toEgyptTime = (date) => {
  return toZonedTime(date, EGYPT_TIMEZONE);
};

/**
 * Format date in Egypt timezone
 */
export const formatEgyptTime = (date, formatStr = 'PPpp') => {
  const egyptTime = toEgyptTime(date);
  return format(egyptTime, formatStr);
};

/**
 * Get time remaining until auction end
 */
export const getTimeRemaining = (endTime) => {
  const now = new Date();
  const end = new Date(endTime);
  const seconds = differenceInSeconds(end, now);
  
  if (seconds <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
  }
  
  const days = Math.floor(seconds / (24 * 60 * 60));
  const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((seconds % (60 * 60)) / 60);
  const secs = seconds % 60;
  
  return {
    days,
    hours,
    minutes,
    seconds: secs,
    total: seconds
  };
};

/**
 * Format time remaining as string
 */
export const formatTimeRemaining = (endTime) => {
  const { days, hours, minutes, seconds, total } = getTimeRemaining(endTime);
  
  if (total <= 0) {
    return 'Auction ended';
  }
  
  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  }
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }
  
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  
  return `${seconds}s`;
};

/**
 * Check if auction has started
*/

export const isAuctionStarted = (auction) => {
  if (!auction) return false;
  return auction.status === "STARTED";
}

/**
 * Check if auction is active
 */
export const isAuctionActive = (auction) => {
  if (!auction) return false;
  return auction.status === 'ACTIVE';
};

/**
 * Check if auction has ended
 */
export const isAuctionEnded = (auction) => {
  if (!auction) return false;
  return auction.status === 'ENDED' || new Date(auction.endTime) < new Date();
};

/**
 * Check if auction is scheduled
 */
export const isAuctionScheduled = (auction) => {
  if (!auction) return false;
  return auction.status === 'SCHEDULED';
};

/**
 * Check if user can bid on auction
 */
export const canUserBid = (auction, userId) => {
  if (!auction || !userId) return false;
  
  // Can't bid on own auction
  if (auction.sellerId === userId) return false;
  
  // Can only bid on active auctions
  if (!isAuctionActive(auction) && !isAuctionStarted(auction)) return false;
  
  // Check if auction has ended
  if (isAuctionEnded(auction)) return false;
  
  return true;
};

/**
 * Calculate minimum next bid
 */
export const calculateMinimumBid = (auction) => {
  if (!auction) return null;
  
  const currentBid = auction.highestBidPlaced?.amount;
  
  if (currentBid) {
    return Number(currentBid) + Number(auction.bidIncrement);
  }
  
  return Number(auction.startingPrice);
};

/**
 * Validate bid amount
 */
export const validateBidAmount = (bidAmount, auction) => {
  if (!auction || !bidAmount) {
    return { valid: false, error: 'Invalid bid amount' };
  }
  
  const minBid = calculateMinimumBid(auction);
  const numBidAmount = Number(bidAmount);
  
  if (isNaN(numBidAmount) || numBidAmount <= 0) {
    return { valid: false, error: 'Bid amount must be a positive number' };
  }
  
  if (numBidAmount < minBid) {
    return { 
      valid: false, 
      error: `Bid must be at least $${minBid.toFixed(2)}` 
    };
  }
  
  return { valid: true };
};

/**
 * Generate idempotency key for bid
 */
export const generateIdempotencyKey = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Get auction status badge variant
 */
export const getAuctionStatusVariant = (status) => {
  const variants = {
    'ACTIVE': 'default',
    'SCHEDULED': 'secondary',
    'ENDED': 'outline',
    'CANCELLED': 'destructive',
    'PAUSED': 'secondary'
  };
  
  return variants[status] || 'outline';
};

/**
 * Format currency
 */
export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return '-';
  return `$${Number(amount).toFixed(2)}`;
};

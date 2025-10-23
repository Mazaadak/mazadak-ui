import React from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Clock, TrendingUp, DollarSign, Gavel } from 'lucide-react'
import { useAuctions } from '../hooks/useAuctions'

const AuctionsPage = () => {
  const { data: auctions, isLoading } = useAuctions()

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price)
  }

  const formatDateTime = (dateTime) => {
    return new Date(dateTime).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTimeRemaining = (endTime) => {
    const now = new Date()
    const end = new Date(endTime)
    const diff = end - now

    if (diff <= 0) return 'Ended'

    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    if (days > 0) return `${days}d ${hours}h`
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  const getStatusVariant = (status) => {
    switch (status) {
      case 'ACTIVE':
        return 'default'
      case 'COMPLETED':
        return 'secondary'
      case 'CANCELLED':
        return 'destructive'
      case 'PENDING':
        return 'outline'
      default:
        return 'outline'
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-2 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-2 bg-gray-200 rounded"></div>
                  <div className="h-2 bg-gray-200 rounded"></div>
                  <div className="h-2 bg-gray-200 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Live Auctions</h1>
        <p className="text-gray-600">Browse and bid on active auctions</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {auctions?.content && auctions.content.map(auction => (
          <Card key={auction.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start mb-2">
                <CardTitle className="text-xl">{auction.title}</CardTitle>
                <Badge variant={getStatusVariant(auction.status)}>
                  {auction.status}
                </Badge>
              </div>
              <CardDescription className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {auction.status === 'ACTIVE' 
                  ? `Ends: ${getTimeRemaining(auction.endTime)}`
                  : `Ended: ${formatDateTime(auction.endTime)}`
                }
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 flex items-center gap-1">
                    <DollarSign className="w-4 h-4" />
                    Starting Price
                  </span>
                  <span className="font-medium">{formatPrice(auction.startingPrice)}</span>
                </div>

                {auction.highestBidPlaced && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 flex items-center gap-1">
                      <TrendingUp className="w-4 h-4" />
                      Current Bid
                    </span>
                    <span className="font-bold text-green-600">
                      {formatPrice(auction.highestBidPlaced.amount)}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 flex items-center gap-1">
                    <Gavel className="w-4 h-4" />
                    Bid Increment
                  </span>
                  <span className="text-sm">{formatPrice(auction.bidIncrement)}</span>
                </div>
              </div>

              <div className="pt-2 border-t text-xs text-gray-500">
                <div>Starts: {formatDateTime(auction.startTime)}</div>
                <div>Ends: {formatDateTime(auction.endTime)}</div>
              </div>
            </CardContent>

            <CardFooter>
              <Button 
                className="w-full" 
                disabled={auction.status !== 'ACTIVE'}
              >
                {auction.status === 'ACTIVE' ? 'Place Bid' : 'View Details'}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {(!auctions?.content || auctions.content.length === 0) && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No auctions available at the moment.</p>
        </div>
      )}
    </div>
  )
}

export default AuctionsPage
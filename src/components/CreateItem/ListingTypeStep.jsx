import React from 'react'
import { Button } from '@/components/ui/button'
import { CardContent } from '../ui/card'
import { DollarSign, Gavel, ArrowRight, TrendingUp, Clock } from 'lucide-react'

const ListingTypeStep = ({ onSelect }) => {
  const listingTypes = [
    {
      id: 'fixed',
      title: 'Fixed Price',
      description: 'Set a price and sell instantly',
      icon: DollarSign,
      features: ['Immediate purchase', 'Simple pricing', 'Quick sales'],
      color: 'bg-green-500',
      gradient: 'from-green-500/10 to-green-500/5',
    },
    {
      id: 'auction',
      title: 'Auction',
      description: 'Let buyers bid for your item',
      icon: Gavel,
      features: ['Competitive bidding', 'Maximize value', 'Timed sale'],
      color: 'bg-purple-500',
      gradient: 'from-purple-500/10 to-purple-500/5',
    }
  ];

  return (
    <CardContent className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {listingTypes.map((type) => {
          const Icon = type.icon;
          return (
            <button
              key={type.id}
              onClick={() => onSelect(type.id)}
              className={`group relative overflow-hidden rounded-xl border-2 border-border hover:border-primary/50 bg-gradient-to-br ${type.gradient} p-6 text-left transition-all duration-300 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]`}
            >
              {/* Animated background gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/0 to-primary/0 group-hover:from-primary/5 group-hover:to-primary/10 transition-all duration-500" />
              
              <div className="relative space-y-4">
                {/* Icon */}
                <div className={`inline-flex p-3 rounded-lg ${type.color} bg-opacity-10 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className={`h-6 w-6 ${type.color.replace('bg-', 'text-')}`} />
                </div>

                {/* Title & Description */}
                <div>
                  <h3 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors">
                    {type.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {type.description}
                  </p>
                </div>

                {/* Features */}
                <ul className="space-y-2">
                  {type.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <div className={`h-1.5 w-1.5 rounded-full ${type.color}`} />
                      {feature}
                    </li>
                  ))}
                </ul>

                {/* Arrow icon */}
                <div className="flex items-center gap-2 text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  Choose {type.title}
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Info banner */}
      <div className="mt-6 p-4 rounded-lg bg-muted/50 border border-border">
        <div className="flex items-start gap-3">
          <TrendingUp className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-medium mb-1">Choose the right format</p>
            <p className="text-muted-foreground text-xs">
              Fixed price listings sell faster, while auctions can help you get the best price for unique or high-demand items.
            </p>
          </div>
        </div>
      </div>
    </CardContent>
  )
}

export default ListingTypeStep
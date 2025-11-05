
import React from 'react'
import { Star, Package, CheckCircle2, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';


const ProductCard = ({ product, onSelect, isSelected }) => {
  const calculateAverageRating = (ratings) => {
    if (ratings.length === 0) return 0;
    return ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
  }

  const avgRating = calculateAverageRating(product.ratings);

  return (
    <div
      onClick={() => onSelect(product.productId)}
      className={`group relative flex gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all duration-300 select-none overflow-hidden
        ${isSelected
          ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10'
          : 'border-border hover:border-primary/30 hover:shadow-md active:scale-[0.99]'
        }`}
    >
      {/* Category Badge - top right */}
      <div className="absolute top-3 right-3 z-10">
        <Badge
          variant="secondary"
          className="text-xs font-medium shadow-sm"
        >
          {product.category.name}
        </Badge>
      </div>

      {/* Animated gradient overlay on hover */}
      <div className={`absolute inset-0 bg-gradient-to-br from-primary/0 to-primary/0 transition-all duration-500 pointer-events-none
        ${isSelected ? 'from-primary/5 to-primary/10' : 'group-hover:from-primary/5 group-hover:to-primary/0'}`} 
      />

      {/* Product Image */}
      <div className="flex-shrink-0 relative z-10">
        {product.images[0] ? (
          <div className="relative">
            <img
              src={product.images[0].imageUri}
              alt={product.title}
              className="w-28 h-28 object-cover rounded-lg shadow-sm group-hover:shadow-md transition-shadow duration-300"
            />
            {isSelected && (
              <div className="absolute inset-0 rounded-lg ring-2 ring-primary ring-offset-2" />
            )}
          </div>
        ) : (
          <div className="w-28 h-28 bg-muted rounded-lg flex items-center justify-center group-hover:bg-muted/80 transition-colors">
            <Package className="w-10 h-10 text-muted-foreground group-hover:scale-110 transition-transform" />
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="flex-1 min-w-0 relative z-10">
        <div className="flex items-start gap-2 mb-2">
          <h3 className={`font-bold text-base truncate flex-1 transition-colors duration-300 ${isSelected ? 'text-primary' : 'group-hover:text-primary'}`}>
            {product.title}
          </h3>
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {product.description}
        </p>

        {/* Price, Rating */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-foreground">
                ${product.price.toFixed(2)}
              </span>
            </div>

            {product.ratings.length > 0 && (
              <div className="flex items-center gap-1.5 px-2 py-1 bg-yellow-500/10 rounded-full">
                <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" />
                <span className="text-sm font-semibold text-yellow-700 dark:text-yellow-300">
                  {avgRating.toFixed(1)}
                </span>
                <span className="text-xs text-muted-foreground">
                  ({product.ratings.length})
                </span>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}

export default ProductCard;

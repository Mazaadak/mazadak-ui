
import React from 'react'
import { Star, Package } from 'lucide-react';
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
      className={`flex gap-4 p-4 border rounded-lg cursor-pointer transition-all select-none
        ${isSelected
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 dark:border-blue-400 shadow-md'
          : 'border-border hover:border-muted hover:shadow-sm'
        }`}
    >
      {/* Product Image */}
      <div className="flex-shrink-0">
        {product.images[0] ? (
          <img
            src={product.images[0].imageUri}
            alt={product.title}
            className="w-24 h-24 object-cover rounded-md"
          />
        ) : (
          <div className="w-24 h-24 bg-muted rounded-md flex items-center justify-center">
            <Package className="w-8 h-8 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-semibold text-lg truncate">{product.title}</h3>

          {/* Status Badge */}
          <Badge
            className={`text-xs font-medium border-none
              ${product.status === 'INACTIVE'
                ? 'bg-gray-500/20 text-gray-600 dark:bg-gray-400/20 dark:text-gray-300'
                : 'bg-blue-100 text-blue-700 dark:bg-blue-400/20 dark:text-blue-300'
              }`}
          >
            {product.status}
          </Badge>
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
          {product.description}
        </p>

        {/* Price, Rating, Category */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-lg font-bold">
              ${product.price.toFixed(2)}
            </span>

            {product.ratings.length > 0 && (
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-medium">{avgRating.toFixed(1)}</span>
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

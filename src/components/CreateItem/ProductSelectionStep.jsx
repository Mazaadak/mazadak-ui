import React, { useState } from 'react'
import CreateProductModal from './CreateProductModal';
import { Button } from '../ui/button';
import { CardContent } from '../ui/card';
import ProductModal from './ProductModal';
import { Package, Plus, Search, Sparkles, ArrowRight } from 'lucide-react';


const ProductSelectionStep = ({ onSelect, onCreate }) => {
	const [showSelectModal, setShowSelectModal] = useState(false);
	const [showCreateModal, setShowCreateModal] = useState(false);

  const options = [
    {
      id: 'select',
      title: 'Select Existing Product',
      description: 'Choose from your product catalog',
      icon: Search,
      action: () => setShowSelectModal(true),
      variant: 'outline',
      gradient: 'from-blue-500/10 to-blue-500/5',
      iconColor: 'text-blue-500',
      iconBg: 'bg-blue-500/10',
    },
    {
      id: 'create',
      title: 'Create New Product',
      description: 'Add a brand new product to sell',
      icon: Plus,
      action: () => setShowCreateModal(true),
      variant: 'default',
      gradient: 'from-primary/10 to-primary/5',
      iconColor: 'text-primary',
      iconBg: 'bg-primary/10',
    }
  ];

  return (
		<div>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {options.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.id}
                onClick={option.action}
                className={`group relative overflow-hidden rounded-xl border-2 border-border hover:border-primary/50 bg-gradient-to-br ${option.gradient} p-6 text-left transition-all duration-300 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]`}
              >
                {/* Animated background */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/0 to-primary/0 group-hover:from-primary/5 group-hover:to-primary/10 transition-all duration-500" />
                
                <div className="relative space-y-4">
                  {/* Icon */}
                  <div className={`inline-flex p-3 rounded-lg ${option.iconBg} group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className={`h-6 w-6 ${option.iconColor}`} />
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors">
                      {option.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {option.description}
                    </p>
                  </div>

                  {/* Arrow indicator */}
                  <div className="flex items-center gap-2 text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    Get Started
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
            <Sparkles className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium mb-1">Getting Started</p>
              <p className="text-muted-foreground text-xs">
                You can either select a product you've already created, or create a new one right now. After selecting or creating a product, you'll choose how to list it.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
      
      <ProductModal
        open={showSelectModal}
        onClose={() => setShowSelectModal(false)}
        onSelect={(id) => {
          onSelect(id);
          setShowSelectModal(false);
        }}
      />

      <CreateProductModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={(id) => {
          onCreate(id);
          setShowCreateModal(false);
        }}
      />
    </div>
  )
}

export default ProductSelectionStep
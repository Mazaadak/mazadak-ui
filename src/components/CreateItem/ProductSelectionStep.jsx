import React, { useState } from 'react'
import CreateProductModal from './CreateProductModal';
import { Button } from '../ui/button';
import { CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import ProductModal from './ProductModal';


const ProductSelectionStep = ({ onSelect, onCreate }) => {
	const [showSelectModal, setShowSelectModal] = useState(false);
	const [showCreateModal, setShowCreateModal] = useState(false);

  return (
		<div>
      <CardHeader>
        <CardTitle>Choose Product Option</CardTitle>
        <CardDescription>Select a product to list on mazadak or create a new one</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <Button variant="outline" onClick={() => setShowSelectModal(true)}>
          Select Existing Product
        </Button>
        <Button onClick={() => setShowCreateModal(true)}>
          Create New Product
        </Button>
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
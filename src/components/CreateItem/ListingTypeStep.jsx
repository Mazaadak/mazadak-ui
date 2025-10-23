import React from 'react'
import { Button } from '@/components/ui/button'
import { CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'

const ListingTypeStep = ({ onSelect }) => {
  return (
    <div className='flex flex-col gap-2'>
      <CardHeader>
        <CardTitle className='text-lg font-medium'>Select Listing Type</CardTitle>
        <CardDescription>Select how you want to list your product.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
          <Button onClick={() => onSelect("fixed")}>Fixed Price</Button>
          <Button onClick={() => onSelect("auction")}>Auction</Button>
        </div>
      </CardContent>
    </div>
  )
}

export default ListingTypeStep
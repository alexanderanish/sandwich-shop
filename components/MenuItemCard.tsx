// components/MenuItemCard.tsx
'use client';

import Image from 'next/image';
import Currency from 'react-currency-formatter';
import { LeanMenuItem } from '@/types'; // Use LeanMenuItem type
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface MenuItemCardProps {
   item: LeanMenuItem; // Expect LeanMenuItem
   onAddToCart: (item: LeanMenuItem) => void;
}

export default function MenuItemCard({ item, onAddToCart }: MenuItemCardProps) {
  const imageUrl = item.images?.[0] || '/images/placeholder.jpg'; // Default placeholder
  const isOutOfStock = item.currentStock <= 0;

  return (
    <Card className="flex flex-col justify-between overflow-hidden"> {/* Added overflow-hidden */}
      <CardHeader className='p-4'> {/* Adjust padding */}
        <div className="relative h-40 w-full mb-3 aspect-video"> {/* Use aspect ratio */}
           <Image
            src={imageUrl}
            alt={item.name}
            fill // Changed from layout="fill"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" // Add sizes prop
            style={{objectFit: "cover"}} // Use style for objectFit
            className="rounded-md"
          />
        </div>
        <CardTitle className='text-lg'>{item.name}</CardTitle> {/* Adjust size */}
        <CardDescription className="text-xs h-12 overflow-y-auto"> {/* Adjust size & height */}
             {item.description}
        </CardDescription>
      </CardHeader>
      <CardContent className='p-4 pt-0'> {/* Adjust padding */}
         <p className="font-semibold text-base mb-2"> {/* Adjust size */}
             <Currency quantity={Number(item.price)} currency="INR" />
         </p>
         <div className='flex flex-wrap gap-1'> {/* Wrap badges */}
            <Badge variant={isOutOfStock ? "destructive" : "secondary"}>
                Stock: {item.currentStock}
            </Badge>
            {item.vegetarian && <Badge variant="outline" className="ml-1">Veg</Badge>}
        </div>
      </CardContent>
      <CardFooter className='p-4 pt-0'> {/* Adjust padding */}
         <Button
             onClick={() => onAddToCart(item)}
             className="w-full"
             disabled={isOutOfStock}
             size="sm" // Adjust size
         >
             {isOutOfStock ? "Out of Stock" : "Add to Cart"}
         </Button>
      </CardFooter>
    </Card>
  );
}
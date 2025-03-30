// components/CartSummary.tsx
'use client';

import { useState } from 'react';
// Use simpler CartItem type
import { CartItem } from '@/types';
import Currency from 'react-currency-formatter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import Image from 'next/image';
import { Trash2, Plus, Minus, Pencil, QrCode, Loader2 } from 'lucide-react';
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
// import { toast } from 'sonner';

interface CartSummaryProps {
  cart: CartItem[];
  // Use simpler handler signatures (no comboDetails)
  onUpdateQuantity: (menuItemId: string, newQuantity: number) => void;
  onRemoveItem: (menuItemId: string) => void;
  onUpdatePrice: (menuItemId: string, newPrice: number | undefined) => void;
  // Other props
  customerName: string;
  setCustomerName: (name: string) => void;
  customerPhone: string;
  setCustomerPhone: (phone: string) => void;
  onGenerateQrClick: () => void;
  orderTotal: number;
  onConfirmOrder: () => Promise<void>;
  onCancelOrder: () => void;
  isSubmitting: boolean;
}

// PriceEditPopover (simpler onUpdatePrice call)
function PriceEditPopover({ item, onUpdatePrice }: { item: CartItem, onUpdatePrice: CartSummaryProps['onUpdatePrice'] }) {
    const [isOpen, setIsOpen] = useState(false);
    const [newPriceStr, setNewPriceStr] = useState<string>( (item.overriddenPrice !== undefined ? item.overriddenPrice : item.price).toString() );
    const handleSave = () => {
        const newPriceNum = parseFloat(newPriceStr);
        const priceToUpdate = (!isNaN(newPriceNum) && newPriceNum >= 0) ? (newPriceNum === item.price ? undefined : newPriceNum) : undefined;
        onUpdatePrice(item.menuItemId, priceToUpdate); // No comboDetails needed
        if (isNaN(newPriceNum) || newPriceNum < 0) { /* Optional local toast */ }
        setIsOpen(false);
    };
    const handleReset = () => { onUpdatePrice(item.menuItemId, undefined); setIsOpen(false); }; // No comboDetails needed
    const handleOpenChange = (open: boolean) => { if (open) { setNewPriceStr((item.overriddenPrice !== undefined ? item.overriddenPrice : item.price).toString()); } setIsOpen(open); };
    const inputId = `price-${item.menuItemId}`; // Simpler ID

    return (
        <Popover open={isOpen} onOpenChange={handleOpenChange}>
             <PopoverTrigger className="inline-flex items-center justify-center ... h-6 w-6 p-0 ml-1 cursor-pointer" aria-label={`Edit price for ${item.name}`}> <Pencil className="h-3 w-3 text-muted-foreground" /> </PopoverTrigger>
             <PopoverContent className="w-48 p-2"> <div className="space-y-2"> <Label htmlFor={inputId} className="text-xs font-medium"> Override Price (₹) </Label> <Input id={inputId} type="number" step="1" min="0" value={newPriceStr} onChange={(e) => setNewPriceStr(e.target.value)} className="h-8 text-sm" placeholder='Enter new price' /> <p className="text-xs text-muted-foreground"> Original: <Currency quantity={item.price} currency="INR" /> </p> <div className="flex justify-end gap-1 mt-1"> <Button variant="outline" size="sm" onClick={handleReset}> Reset </Button> <Button size="sm" onClick={handleSave}> Save </Button> </div> </div> </PopoverContent>
        </Popover>
    );
}

export default function CartSummary({
  cart,
  onUpdateQuantity,
  onRemoveItem,
  customerName,
  setCustomerName,
  customerPhone,
  setCustomerPhone,
  onUpdatePrice,
  onGenerateQrClick,
  orderTotal,
  onConfirmOrder,
  onCancelOrder,
  isSubmitting,
}: CartSummaryProps) {

  const total = orderTotal;

  return (
    <div className="p-4 border rounded-lg sticky top-4 bg-card shadow">
      <h2 className="text-2xl font-semibold mb-4 text-card-foreground">Current Order</h2>
      {/* Customer Details Section */}
       <div className="space-y-3 mb-4">
            <div className="grid w-full items-center gap-1.5"> <Label htmlFor="customerName" className='text-sm'>Customer Name</Label> <Input type="text" id="customerName" placeholder="Optional" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="h-9" disabled={isSubmitting} /> </div>
            <div className="grid w-full items-center gap-1.5"> <Label htmlFor="customerPhone" className='text-sm'>Customer Phone</Label> <Input type="tel" id="customerPhone" placeholder="Optional" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className="h-9" disabled={isSubmitting} /> </div>
       </div>
      <Separator />
      {/* Cart Items List */}
       <ScrollArea className="h-[calc(40vh - 110px)] w-full pr-3 mt-3">
         {cart.length === 0 ? ( <p className="text-muted-foreground mt-4 text-center py-5">Your cart is empty.</p> ) : (
           <div className="space-y-3 mt-1">
             {cart.map((item) => { // No combo check needed here
                const effectivePrice = item.overriddenPrice ?? item.price;
                const isOverridden = item.overriddenPrice !== undefined;
                const itemKey = item.menuItemId; // Simpler key

                return (
                    <div key={itemKey} className="flex items-center space-x-2 text-card-foreground">
                        {item.image && ( <div className="relative h-10 w-10 flex-shrink-0"><Image src={item.image} alt={item.name} fill sizes="40px" style={{objectFit: "cover"}} className="rounded-sm"/></div> )}
                        <div className="flex-grow min-w-0">
                            <p className={`font-medium text-sm truncate ${isOverridden ? 'text-blue-600 dark:text-blue-400' : ''}`}>
                                {item.name} {/* Just display name */}
                            </p>
                            {/* No combo details display needed */}
                            <div className="text-xs text-muted-foreground flex items-center">
                                <Currency quantity={effectivePrice} currency="INR" /> ea.
                                 {isOverridden && ( <span className='ml-1 line-through'>(<Currency quantity={item.price} currency="INR" />)</span> )}
                                <PriceEditPopover item={item} onUpdatePrice={onUpdatePrice} />
                            </div>
                        </div>
                        {/* Quantity Controls - call simpler handlers */}
                        <div className="flex items-center space-x-1 flex-shrink-0">
                            <Button variant="outline" size="icon" className="h-6 w-6 cursor-pointer" onClick={() => onUpdateQuantity(item.menuItemId, item.quantity - 1)} aria-label={`Decrease quantity of ${item.name}`} disabled={isSubmitting}> <Minus className="h-3 w-3" /> </Button>
                            <span className="w-6 text-center text-sm font-medium tabular-nums">{item.quantity}</span>
                            <Button variant="outline" size="icon" className="h-6 w-6 cursor-pointer" onClick={() => onUpdateQuantity(item.menuItemId, item.quantity + 1)} aria-label={`Increase quantity of ${item.name}`} disabled={isSubmitting}> <Plus className="h-3 w-3" /> </Button>
                        </div>
                        {/* Remove Button - call simpler handler */}
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:bg-destructive/10 flex-shrink-0 cursor-pointer" onClick={() => onRemoveItem(item.menuItemId)} aria-label={`Remove ${item.name} from cart`} disabled={isSubmitting}> <Trash2 className="h-4 w-4" /> </Button>
                    </div>
                );
             })}
           </div>
         )}
       </ScrollArea>
      <Separator className="my-4" />
      {/* Footer Section (Buttons remain the same) */}
      <div className="space-y-3">
         <div className="flex justify-between font-semibold text-lg text-card-foreground"> <span>Total:</span> <span className='tabular-nums'> <Currency quantity={total} currency="INR" /> </span> </div>
          <Button variant="outline" className="w-full cursor-pointer" onClick={onGenerateQrClick} disabled={cart.length === 0 || total <= 0 || isSubmitting} > <QrCode className="mr-2 h-4 w-4" /> Generate Payment QR </Button>
          <Button variant="outline" className="w-full cursor-pointer" onClick={onCancelOrder} disabled={isSubmitting} > Cancel Order </Button> <Button className="w-full cursor-pointer" onClick={onConfirmOrder} disabled={cart.length === 0 || isSubmitting} > {isSubmitting ? ( <> <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting... </> ) : ( 'Confirm Order' )} </Button>
      </div>
    </div>
  );
}
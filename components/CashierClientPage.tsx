// components/CashierClientPage.tsx
'use client';

import { useState, useMemo, useCallback } from 'react';
import { toast } from "sonner";
// Use simpler LeanMenuItem and CartItem types from before combo feature
import { LeanMenuItem, CartItem } from '@/types';
import MenuItemCard from './MenuItemCard';
import CartSummary from './CartSummary';
import { Separator } from '@/components/ui/separator';
import { Input } from "@/components/ui/input";
import {
    Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";
import QRCode from "react-qr-code";
import Currency from 'react-currency-formatter';

interface CashierClientPageProps {
  initialMenuItems: LeanMenuItem[];
}

export default function CashierClientPage({ initialMenuItems }: CashierClientPageProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [isQrDialogOpen, setIsQrDialogOpen] = useState(false);
  const [upiUri, setUpiUri] = useState('');
  const [qrAmount, setQrAmount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCancelAlertOpen, setIsCancelAlertOpen] = useState(false);
  // No Combo Dialog state here

  // --- Cart Functions (Simpler addToCart) ---
  const addToCart = useCallback((item: LeanMenuItem) => {
        // No check for item.isComboBase here
        if (item.currentStock <= 0) { toast.error(`${item.name} is currently unavailable.`); return; }
        if (!item._id) { console.error("Item missing _id:", item); toast.error("Could not add item. Missing ID."); return; }
        const existingCartItem = cart.find(cartItem => cartItem.menuItemId === item._id);
        const currentCartQuantity = existingCartItem?.quantity ?? 0;
        if (currentCartQuantity >= item.currentStock) { toast.warning(`Cannot add more ${item.name}. Only ${item.currentStock} available.`); return; }
        setCart((prevCart) => {
          const existingItemIndex = prevCart.findIndex((cartItem) => cartItem.menuItemId === item._id );
          let updatedCart: CartItem[];
          if (existingItemIndex !== -1) { updatedCart = [...prevCart]; if (updatedCart[existingItemIndex].quantity < item.currentStock) { updatedCart[existingItemIndex] = { ...updatedCart[existingItemIndex], quantity: updatedCart[existingItemIndex].quantity + 1, }; } else { return prevCart; } } else { const newItem: CartItem = { menuItemId: item._id, name: item.name, price: Number(item.price), quantity: 1, image: item.images?.[0] }; updatedCart = [...prevCart, newItem]; }
          return updatedCart;
        });
        toast.success(`${item.name} added to cart.`);
  }, [cart]);

  const updateCartQuantity = useCallback((menuItemId: string, newQuantity: number) => {
        // Simpler signature, no comboDetails needed
        const menuItem = initialMenuItems.find(item => item._id === menuItemId);
        const stock = menuItem?.currentStock ?? 0;
        const name = menuItem?.name ?? 'Item';
        if (newQuantity <= 0) { toast.info(`${name} removed from cart.`); setCart((prevCart) => prevCart.filter((item) => item.menuItemId !== menuItemId)); return; }
        if (newQuantity > stock) { toast.warning(`Only ${stock} ${name}(s) available.`); return; }
        setCart((prevCart) => prevCart.map((item) => item.menuItemId === menuItemId ? { ...item, quantity: newQuantity } : item ));
   }, [initialMenuItems]);

  const removeFromCart = useCallback((menuItemId: string) => {
        // Simpler signature, no comboDetails needed
       const itemToRemove = cart.find(item => item.menuItemId === menuItemId);
       toast.info(`${itemToRemove ? itemToRemove.name : 'Item'} removed from cart.`);
      setCart((prevCart) => prevCart.filter((item) => item.menuItemId !== menuItemId));
   }, [cart]);

  const updateItemPrice = useCallback((menuItemId: string, newPrice: number | undefined) => {
        // Simpler signature, no comboDetails needed
       setCart((prevCart) => prevCart.map((item) => {
           if (item.menuItemId === menuItemId) {
               const priceToSet = (newPrice === undefined || isNaN(newPrice) || newPrice < 0) ? undefined : Number(newPrice);
               toast.info(`${item.name} price ${priceToSet !== undefined ? `overridden to ₹${priceToSet.toFixed(2)}` : 'reset to original'}.`);
               return { ...item, overriddenPrice: priceToSet };
           } return item;
       }));
   }, []);

  // --- Filtered Items, Total Calc, QR Gen, Confirm/Cancel (remain largely the same) ---
  const filteredMenuItems = useMemo(() => { const query = searchQuery.toLowerCase().trim(); if (!query) { return initialMenuItems; } return initialMenuItems.filter(item => item.name.toLowerCase().includes(query) || item.description.toLowerCase().includes(query) || item.category.toLowerCase().includes(query) ); }, [initialMenuItems, searchQuery]);
  const calculateTotal = useCallback(() => { return cart.reduce((total, item) => { const effectivePrice = item.overriddenPrice ?? item.price; return total + (effectivePrice * item.quantity); }, 0); }, [cart]);
  const orderTotal = calculateTotal();
  const handleGenerateQrCode = useCallback(() => { if (orderTotal <= 0) { toast.error("Cannot generate QR code for empty or zero amount order."); return; } const recipientUPI = process.env.NEXT_PUBLIC_UPI_ID; const recipientName = process.env.NEXT_PUBLIC_PAYEE_NAME; if (!recipientUPI || !recipientName) { toast.error("UPI ID or Payee Name is not configured."); console.error("Missing NEXT_PUBLIC_UPI_ID or NEXT_PUBLIC_PAYEE_NAME"); return; } const amount = orderTotal.toFixed(2); const transactionId = `SANDWICHSHOP-${Date.now()}`; const transactionNote = `Order Payment (${cart.length} items)`; const params = new URLSearchParams({ pa: recipientUPI, pn: recipientName, am: amount, tid: transactionId, tn: transactionNote, cu: 'INR', }); const uri = `upi://pay?${params.toString()}`; setUpiUri(uri); setQrAmount(orderTotal); setIsQrDialogOpen(true); }, [orderTotal, cart]);
  const clearOrder = () => { setCart([]); setCustomerName(''); setCustomerPhone(''); setSearchQuery(''); };
  const handleConfirmOrder = async () => { if (cart.length === 0) { toast.error("Cannot confirm an empty order."); return; } setIsSubmitting(true); const orderData = { items: cart, customerName: customerName.trim() || undefined, customerPhone: customerPhone.trim() || undefined, totalAmount: orderTotal }; try { const response = await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json', }, body: JSON.stringify(orderData), }); if (!response.ok) { const errorBody = await response.json(); throw new Error(errorBody.message || `HTTP error! status: ${response.status}`); } const savedOrder = await response.json(); toast.success(`Order #${savedOrder._id.slice(-6)} confirmed successfully!`); clearOrder(); } catch (error) { console.error("Failed to confirm order:", error); toast.error(`Order submission failed: ${error instanceof Error ? error.message : String(error)}`); } finally { setIsSubmitting(false); } };
  const handleCancelOrder = () => { if (cart.length > 0 || customerName || customerPhone) { setIsCancelAlertOpen(true); } else { toast.info("Nothing to cancel."); } };
  const performCancelOrder = () => { clearOrder(); toast.info("Order cancelled."); }


  // --- JSX (No Combo Dialog) ---
  return (
    <>
      <div className="flex flex-col md:flex-row gap-8">
        {/* Menu Section */}
        <div className="w-full md:w-3/5 lg:w-2/3">
            <div className="flex justify-between items-center mb-4 gap-4"><h2 className="text-2xl font-semibold flex-shrink-0">Menu</h2><Input type="text" placeholder="Search menu..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="max-w-sm w-full"/></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 min-h-[50vh]">{filteredMenuItems.length > 0 ? ( filteredMenuItems.map((item) => ( <MenuItemCard key={item._id} item={item} onAddToCart={addToCart} /> )) ) : ( <p className="text-muted-foreground col-span-full text-center pt-10"> No menu items match your search. </p> )}</div>
        </div>
        <Separator orientation="vertical" className="hidden md:block h-auto" />
        <Separator orientation="horizontal" className="block md:hidden" />
        {/* Cart Summary Section (Pass simpler handler signatures) */}
        <div className="w-full md:w-2/5 lg:w-1/3">
          <CartSummary
            cart={cart}
            onUpdateQuantity={updateCartQuantity} // Simpler signature
            onRemoveItem={removeFromCart} // Simpler signature
            customerName={customerName}
            setCustomerName={setCustomerName}
            customerPhone={customerPhone}
            setCustomerPhone={setCustomerPhone}
            onUpdatePrice={updateItemPrice} // Simpler signature
            onGenerateQrClick={handleGenerateQrCode}
            orderTotal={orderTotal}
            onConfirmOrder={handleConfirmOrder}
            onCancelOrder={handleCancelOrder}
            isSubmitting={isSubmitting}
          />
        </div>
      </div>

      {/* --- NO Sandwich Selection Dialog --- */}

      {/* --- Other Dialogs (QR Code, Cancel Alert) --- */}
      <Dialog open={isQrDialogOpen} onOpenChange={setIsQrDialogOpen}>
          <DialogContent className="sm:max-w-[425px] bg-white"> <DialogHeader> <DialogTitle>Scan UPI QR Code to Pay</DialogTitle> <DialogDescription> Scan this code with any UPI app. Amount: <span className='font-bold'><Currency quantity={qrAmount} currency="INR" /></span> </DialogDescription> </DialogHeader> <div className="flex justify-center items-center p-4 my-4 bg-gray-50 rounded-md"> {upiUri ? ( <QRCode value={upiUri} size={256} level="M" viewBox={`0 0 256 256`} /> ) : ( <p className="text-destructive">Could not generate QR code URI.</p> )} </div> <DialogFooter className="sm:justify-center text-center text-xs text-muted-foreground"> Paying to: {process.env.NEXT_PUBLIC_PAYEE_NAME} ({process.env.NEXT_PUBLIC_UPI_ID}) <br/> Ensure payment is confirmed before proceeding. </DialogFooter> </DialogContent>
      </Dialog>
      <AlertDialog open={isCancelAlertOpen} onOpenChange={setIsCancelAlertOpen}>
          <AlertDialogContent> <AlertDialogHeader> <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle> <AlertDialogDescription> This action cannot be undone. This will discard the current order details and clear the cart. </AlertDialogDescription> </AlertDialogHeader> <AlertDialogFooter> <AlertDialogCancel>Keep Order</AlertDialogCancel> <AlertDialogAction onClick={performCancelOrder} className='bg-destructive text-destructive-foreground hover:bg-destructive/90'> Discard Order </AlertDialogAction> </AlertDialogFooter> </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
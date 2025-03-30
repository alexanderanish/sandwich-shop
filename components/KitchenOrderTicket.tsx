// components/KitchenOrderTicket.tsx
'use client';

import { useState, useEffect } from 'react';
// Use simpler LeanOrder type
import { LeanOrder } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from "@/components/ui/badge";
import { Separator } from '@/components/ui/separator';
import { Loader2, UserX, UserCheck } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
// import Currency from 'react-currency-formatter';

interface KitchenOrderTicketProps {
    order: LeanOrder;
    onUpdateStatus: (orderId: string, newStatus: LeanOrder['status']) => Promise<void>;
    onAssignOrder: (orderId: string, assignee: string | null) => Promise<void>;
    isUpdating: boolean;
}

export default function KitchenOrderTicket({ order, onUpdateStatus, onAssignOrder, isUpdating }: KitchenOrderTicketProps) {
    const [assigneeInput, setAssigneeInput] = useState<string>(order.assignedTo || '');
    useEffect(() => { setAssigneeInput(order.assignedTo || ''); }, [order.assignedTo]);
    const handleAssign = () => { const trimmedAssignee = assigneeInput.trim(); onAssignOrder(order._id, trimmedAssignee === '' ? null : trimmedAssignee); };
    const handleClearAssignment = () => { setAssigneeInput(''); onAssignOrder(order._id, null); }

    let nextStatus: LeanOrder['status'] | null = null;
    let actionText = '';
    switch (order.status) {
        case 'Confirmed': nextStatus = 'InProgress'; actionText = 'Start Cooking'; break;
        case 'InProgress': nextStatus = 'Ready'; actionText = 'Mark Ready'; break;
        case 'Ready': nextStatus = 'Delivered'; actionText = 'Mark Delivered'; break;
    }

    let timeAgo = 'Invalid Date';
    try { if (order.createdAt && typeof order.createdAt === 'string') { timeAgo = formatDistanceToNow(parseISO(order.createdAt), { addSuffix: true }); } } catch (e) { console.error("Error parsing date for order:", order._id, order.createdAt, e); }

    const getStatusBadgeVariant = (status: LeanOrder['status']): "default" | "secondary" | "destructive" | "outline" => { switch (status) { case 'Confirmed': return 'secondary'; case 'InProgress': return 'default'; case 'Ready': return 'outline'; case 'Delivered': return 'secondary'; case 'Cancelled': return 'destructive'; case 'Refunded': return 'destructive'; case 'Pending': return 'secondary'; default: return 'secondary'; } };

    return (
        <Card className="flex flex-col justify-between shadow-md break-inside-avoid">
            <CardHeader className="p-3 md:p-4">
                 <div className="flex justify-between items-center mb-1"> <CardTitle className="text-base md:text-lg">{order.customerName} - Order #{order._id.slice(-6)} </CardTitle> <Badge variant={getStatusBadgeVariant(order.status)} className='text-xs md:text-sm'>{order.status}</Badge> </div>
                 <CardDescription className="text-s "> Received: {timeAgo} {order.customerName && `- ${order.customerName}`} </CardDescription>
            </CardHeader>

            <CardContent className="p-3 md:p-4 pt-0 flex-grow">
                <p className="text-sm font-medium mb-2">Items:</p>
                {/* --- Simpler Item List Rendering --- */}
                <ul className="space-y-1 list-disc list-inside text-sm max-h-28 overflow-y-auto pr-1">
                    {order.items.map((item, index) => (
                        // No combo check needed here
                        <li key={`${item.menuItemId}-${index}`}>
                            <span className="font-semibold">{item.quantity}x</span> {item.name}
                            {/* Optionally show override info */}
                            {item.overriddenPricePerItem !== undefined && (
                                <span className='text-blue-600 dark:text-blue-400 text-xs ml-1' title={`Original: ₹${item.pricePerItem.toFixed(2)}`}>
                                    (Price Overridden)
                                </span>
                            )}
                        </li>
                    ))}
                </ul>
                 {/* --- END Simpler Rendering --- */}
            </CardContent>

            <Separator />

            <CardFooter className="p-3 md:p-4 flex flex-col gap-3 items-start">
                {/* Assignment Section (Unchanged) */}
                 <div className='w-full'> <label htmlFor={`assign-${order._id}`} className='text-xs font-medium mb-1 block'>Assign To:</label> <div className="flex gap-2 items-center"> <Input id={`assign-${order._id}`} type="text" placeholder="Team member..." value={assigneeInput} onChange={(e) => setAssigneeInput(e.target.value)} className="h-8 flex-grow text-sm" disabled={isUpdating || order.status === 'Delivered'} /> {(assigneeInput || order.assignedTo) && ( <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0 text-muted-foreground hover:text-destructive" onClick={handleClearAssignment} disabled={isUpdating || order.status === 'Delivered'} aria-label="Clear assignment" title="Clear assignment" > <UserX className="h-4 w-4" /> </Button> )} {assigneeInput !== (order.assignedTo || '') && ( <Button size="icon" className="h-8 w-8 flex-shrink-0" onClick={handleAssign} disabled={isUpdating || order.status === 'Delivered'} aria-label="Save assignment" title="Save assignment" > <UserCheck className="h-4 w-4" /> </Button> )} </div> {!assigneeInput && order.assignedTo && ( <p className='text-xs text-muted-foreground mt-1'>Assigned to: {order.assignedTo}</p> )} </div>
                {/* Status Update Button (Unchanged) */}
                 {nextStatus && actionText && ( <Button onClick={() => onUpdateStatus(order._id, nextStatus!)} disabled={isUpdating} className="w-full mt-2 text-sm" size="sm" variant={order.status === 'Ready' ? 'default' : 'outline'} > {isUpdating ? ( <Loader2 className="mr-2 h-4 w-4 animate-spin" /> ) : ( actionText )} </Button> )}
            </CardFooter>
        </Card>
    );
}
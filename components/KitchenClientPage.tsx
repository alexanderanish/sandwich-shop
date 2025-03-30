// components/KitchenClientPage.tsx
'use client';

import { useState, useCallback } from 'react';
import { toast } from "sonner";
import { LeanOrder } from '@/types'; // Import the lean order type
import KitchenOrderTicket from './KitchenOrderTicket' ; // Import the ticket component (create next)

interface KitchenClientPageProps {
    initialOrders: LeanOrder[];
}

export default function KitchenClientPage({ initialOrders }: KitchenClientPageProps) {
    // State to hold the orders displayed on the page
    const [orders, setOrders] = useState<LeanOrder[]>(initialOrders);
    // Optional: State to track which order is currently being updated (for loading indicators)
    const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

    // --- Handler for Updating Order Status ---
    const handleUpdateStatus = useCallback(async (orderId: string, newStatus: LeanOrder['status']) => {
        setUpdatingOrderId(orderId); // Indicate loading for this specific order
        try {
            const response = await fetch(`/api/orders/${orderId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: newStatus }),
            });

            if (!response.ok) {
                const errorBody = await response.json();
                throw new Error(errorBody.message || `Failed to update status (HTTP ${response.status})`);
            }

            const updatedOrder: LeanOrder = await response.json();

            // Update local state
            setOrders(prevOrders => {
                // If the new status means it's no longer "active", filter it out
                if (['Delivered', 'Cancelled', 'Refunded'].includes(updatedOrder.status)) {
                    toast.success(`Order ${orderId.slice(-6)} marked as ${updatedOrder.status}.`);
                    return prevOrders.filter(o => o._id !== orderId);
                } else {
                    // Otherwise, update the order in the list
                    toast.success(`Order ${orderId.slice(-6)} status updated to ${updatedOrder.status}.`);
                    return prevOrders.map(o => o._id === orderId ? updatedOrder : o);
                }
            });

        } catch (error) {
            console.error(`Error updating status for order ${orderId}:`, error);
            toast.error(`Failed to update status: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            setUpdatingOrderId(null); // Clear loading indicator
        }
    }, []); // No external state dependencies needed inside, relies on args

    // --- Handler for Assigning Order ---
    const handleAssignOrder = useCallback(async (orderId: string, assignee: string | null) => {
        // Allow assigning even if another update is in progress? Yes, separate action.
         const assigneeToSave = assignee?.trim() || null; // Trim and save null if empty

        try {
            const response = await fetch(`/api/orders/${orderId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ assignedTo: assigneeToSave }), // Send null if empty/trimmed empty
            });

            if (!response.ok) {
                const errorBody = await response.json();
                throw new Error(errorBody.message || `Failed to assign order (HTTP ${response.status})`);
            }

            const updatedOrder: LeanOrder = await response.json();

            // Update local state
            setOrders(prevOrders =>
                prevOrders.map(o => (o._id === orderId ? updatedOrder : o))
            );
            toast.success(`Order ${orderId.slice(-6)} assigned to ${updatedOrder.assignedTo || 'nobody'}.`);

        } catch (error) {
            console.error(`Error assigning order ${orderId}:`, error);
            toast.error(`Failed to assign order: ${error instanceof Error ? error.message : String(error)}`);
        }
        // No separate loading state for assignment for now
    }, []); // No external state dependencies needed inside

    return (
        <div>
            {orders.length === 0 ? (
                <p className="text-muted-foreground text-center py-10">
                    No active orders found.
                </p>
            ) : (
                // Render orders in a grid
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {orders.map((order) => (
                        <KitchenOrderTicket
                            key={order._id}
                            order={order}
                            onUpdateStatus={handleUpdateStatus}
                            onAssignOrder={handleAssignOrder}
                            isUpdating={updatingOrderId === order._id} // Pass loading state for this specific ticket
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
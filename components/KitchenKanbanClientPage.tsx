// components/KitchenKanbanClientPage.tsx
'use client';

import { useState, useMemo, useCallback } from 'react';
import { toast } from "sonner";
import { LeanOrder } from '@/types';
import KitchenOrderTicket from './KitchenOrderTicket'; // Reuse the existing ticket component
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"; // For horizontal scroll

interface KitchenKanbanClientPageProps {
    initialOrders: LeanOrder[];
}

// Define columns and their corresponding statuses, including Delivered
const columns: { title: string; statuses: LeanOrder['status'][] }[] = [
    { title: 'Pending / Confirmed', statuses: ['Pending','Confirmed'] },
    { title: 'In Progress', statuses: ['InProgress'] },
    { title: 'Ready', statuses: ['Ready'] },
    { title: 'Delivered', statuses: ['Delivered'] }, // Added Delivered column
];

export default function KitchenKanbanClientPage({ initialOrders }: KitchenKanbanClientPageProps) {
    const [orders, setOrders] = useState<LeanOrder[]>(initialOrders);
    const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

    // --- Handlers ---
    const handleUpdateStatus = useCallback(async (orderId: string, newStatus: LeanOrder['status']) => {
        setUpdatingOrderId(orderId);
        try {
            const response = await fetch(`/api/orders/${orderId}`, {
                method: 'PATCH', headers: { 'Content-Type': 'application/json', }, body: JSON.stringify({ status: newStatus }),
            });
            if (!response.ok) { const errorBody = await response.json(); throw new Error(errorBody.message || `Failed update (HTTP ${response.status})`); }
            const updatedOrder: LeanOrder = await response.json();

            // Update state: Always map the updated order into the list
            setOrders(prevOrders =>
                 prevOrders.map(o => (o._id === orderId ? updatedOrder : o))
            );
            toast.success(`Order ${orderId.slice(-6)} status updated to ${updatedOrder.status}.`);

            // Optionally remove if Cancelled/Refunded (if those statuses were fetched and columns existed)
            if (['Cancelled', 'Refunded'].includes(updatedOrder.status)) {
                 setOrders(prevOrders => prevOrders.filter(o => o._id !== orderId));
                 toast.info(`Order ${orderId.slice(-6)} moved to ${updatedOrder.status} and removed from board.`);
             }

        } catch (error) {
            console.error(`Error updating status for order ${orderId}:`, error);
            toast.error(`Failed to update status: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            setUpdatingOrderId(null);
        }
    }, []); // Empty dependency array, uses function arguments

    const handleAssignOrder = useCallback(async (orderId: string, assignee: string | null) => {
        const assigneeToSave = assignee?.trim() || null;
        try {
            const response = await fetch(`/api/orders/${orderId}`, {
                method: 'PATCH', headers: { 'Content-Type': 'application/json', }, body: JSON.stringify({ assignedTo: assigneeToSave }),
            });
            if (!response.ok) { const errorBody = await response.json(); throw new Error(errorBody.message || `Failed assign (HTTP ${response.status})`); }
            const updatedOrder: LeanOrder = await response.json();
            setOrders(prevOrders => prevOrders.map(o => (o._id === orderId ? updatedOrder : o)) );
            toast.success(`Order ${orderId.slice(-6)} assigned to ${updatedOrder.assignedTo || 'nobody'}.`);
        } catch (error) {
            console.error(`Error assigning order ${orderId}:`, error);
            toast.error(`Failed to assign order: ${error instanceof Error ? error.message : String(error)}`);
        }
    }, []); // Empty dependency array
    // --- End Handlers ---


    // Memoize filtering orders into columns
    const ordersByColumn = useMemo(() => {
        const grouped: Record<string, LeanOrder[]> = {};
        // Initialize arrays for all defined columns
        for (const col of columns) {
            grouped[col.title] = [];
        }
        // Group orders into the correct column based on status
        orders.forEach(order => {
            const targetColumn = columns.find(col => col.statuses.includes(order.status));
            if (targetColumn) {
                grouped[targetColumn.title].push(order);
            }
            // Orders with statuses not matching any column definition are ignored
        });
        return grouped;
    }, [orders]); // Dependency: orders state


    // --- Rendering Logic ---
    return (
        <div className="w-full">
            {/* Show message only if no orders were fetched initially AND current state is empty */}
            {initialOrders.length === 0 && orders.length === 0 ? (
                 <p className="text-muted-foreground text-center py-10">
                    No active orders found for the board.
                </p>
             ) : (
                // Use ScrollArea for horizontal scrolling on smaller screens
                <ScrollArea className="w-full whitespace-nowrap pb-4">
                    <div className="flex w-max space-x-4">
                        {/* Map over the defined columns */}
                        {columns.map((col) => (
                            <div key={col.title} className="w-[300px] lg:w-[320px] flex-shrink-0"> {/* Fixed width column */}
                                <h2 className="text-lg font-semibold mb-3 px-1 sticky top-0 bg-secondary/40 z-10 py-1"> {/* Sticky column header */}
                                    {col.title} ({ordersByColumn[col.title]?.length || 0})
                                </h2>
                                {/* Column content area */}
                                <div className="flex flex-col gap-3 h-full bg-muted/40 p-2 rounded-lg min-h-[60vh]">
                                    {/* Map over orders for this specific column */}
                                    {ordersByColumn[col.title] && ordersByColumn[col.title].length > 0 ? (
                                        ordersByColumn[col.title].map(order => (
                                            <KitchenOrderTicket
                                                key={order._id}
                                                order={order}
                                                onUpdateStatus={handleUpdateStatus}
                                                onAssignOrder={handleAssignOrder}
                                                isUpdating={updatingOrderId === order._id}
                                            />
                                        ))
                                    ) : (
                                        // Placeholder if column is empty
                                        <div className="flex items-center justify-center h-full text-muted-foreground text-sm p-4 text-center rounded-lg border border-dashed">
                                            No orders in this stage.
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                    <ScrollBar orientation="horizontal" />
                </ScrollArea>
             )}
        </div>
    );
}
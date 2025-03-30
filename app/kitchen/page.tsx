// app/kitchen/page.tsx
// import Link from 'next/link';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order'; // Ensure Order model is imported correctly
import { LeanOrder, LeanOrderItem } from '@/types'; // Import the lean types
import KitchenClientPage from '@/components/KitchenClientPage'; // Client component
// import { Button } from '@/components/ui/button'; // For potential links/actions

// Function to fetch active orders from the database
async function getActiveOrders(): Promise<LeanOrder[]> {
    console.log("Attempting to connect to DB..."); // Log start
    await dbConnect();
    console.log("DB Connected. Fetching active orders..."); // Log connection success
    try {
        const activeOrders = await Order.find({
            status: { $in: ['Confirmed', 'InProgress'] } // Find orders confirmed or in progress
        })
        .sort({ createdAt: 1 }) // Sort by creation time (oldest first)
        .lean() // Get plain JS objects
        .exec();

        console.log(`Workspaceed ${activeOrders.length} active orders.`); // Log count

        // Map to LeanOrder, ensuring correct types (string IDs, ISO date strings)
        // Add checks for potentially null/undefined values during mapping
        return activeOrders.map((order): LeanOrder => {
             if (!order._id || !order.createdAt || !order.updatedAt) {
                 // This should ideally not happen for valid Mongo documents
                 console.error("Order missing essential fields (_id, createdAt, updatedAt):", order);
                 throw new Error(`Order document ${order._id} is missing essential fields.`);
             }

             const leanItems = order.items.map((item): LeanOrderItem => {
                 if (!item || !item.menuItemId) {
                    console.error("Invalid item found in order:", item, "Order ID:", order._id);
                    throw new Error(`Invalid item data found in order ${order._id}`);
                 }
                 return {
                    menuItemId: item.menuItemId.toString(),
                    name: item.name,
                    quantity: Number(item.quantity || 0),
                    pricePerItem: Number(item.pricePerItem || 0),
                    overriddenPricePerItem: item.overriddenPricePerItem != null ? Number(item.overriddenPricePerItem) : undefined,
                 };
             });

             return {
                _id: order._id.toString(),
                customerName: order.customerName,
                customerPhone: order.customerPhone,
                items: leanItems,
                totalAmount: Number(order.totalAmount || 0),
                status: order.status,
                assignedTo: order.assignedTo ?? null, // Handle potential undefined
                paymentReceived: order.paymentReceived,
                createdAt: order.createdAt.toISOString(),
                updatedAt: order.updatedAt.toISOString(),
             };
        });

    } catch (error) {
        console.error("Failed to fetch or process active orders:", error);
        // Re-throw the error or return empty array based on how you want to handle errors
        // Throwing might trigger Next.js error boundaries (error.tsx)
        // Returning [] will show "No active orders found" on the client page
         throw error; // Let's throw to see the error clearly during development
        // return [];
    }
}

export default async function KitchenPage() {
    let initialOrders: LeanOrder[] = [];
    let fetchError: string | null = null;

    try {
        console.log("Fetching orders for KitchenPage...");
        initialOrders = await getActiveOrders();
        console.log("Successfully fetched orders for KitchenPage.");
    } catch (error) {
        console.error("Error fetching initial orders in KitchenPage:", error);
        fetchError = error instanceof Error ? error.message : "An unknown error occurred during data fetching.";
         // Optionally render an error state here or let KitchenClientPage handle empty initialOrders
    }

    return (
        <div className="container mx-auto p-4">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Kitchen View - Active Orders</h1>
            </div>

            {/* Render error message if fetching failed */}
            {fetchError && (
                 <div className="text-destructive bg-destructive/10 p-4 rounded-md mb-4">
                     <p className='font-bold'>Error loading orders:</p>
                     <p>{fetchError}</p>
                     <p className='mt-2 text-sm'>Please check the server logs and database connection.</p>
                 </div>
            )}

            {/* Pass initial orders (possibly empty) to the client component */}
            {/* KitchenClientPage should handle the case where initialOrders is empty */}
            <KitchenClientPage initialOrders={initialOrders} />
        </div>
    );
}

// Keep dynamic fetching to ensure fresh data
export const dynamic = 'force-dynamic';
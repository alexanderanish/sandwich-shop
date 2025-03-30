// app/kitchen/board/page.tsx
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order'; // Ensure Order model is imported correctly
import { LeanOrder, LeanOrderItem } from '@/types'; // Import the lean types
import KitchenKanbanClientPage from '@/components/KitchenKanbanClientPage'; // Client component
// import { Button } from '@/components/ui/button'; // For potential links/actions (optional here)

// Function to fetch orders relevant to the Kanban board
async function getKanbanOrders(): Promise<LeanOrder[]> {
    console.log("Kanban: Attempting DB connection...");
    await dbConnect();
    console.log("Kanban: DB Connected. Fetching Kanban orders...");
    try {
        // Fetch Confirmed, InProgress, Ready, AND Delivered statuses
        const statusesToFetch: LeanOrder['status'][] = ['Confirmed', 'InProgress', 'Ready', 'Delivered'];
        // TODO: Consider adding a time limit for fetching 'Delivered' orders later for performance
        // e.g., add a condition like { createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } // Last 24 hours
        const kanbanOrders = await Order.find({
            status: { $in: statusesToFetch }
        })
        .sort({ createdAt: 1 }) // Sort oldest first overall
        .lean() // Get plain JS objects
        .exec();

        console.log(`Kanban: Fetched ${kanbanOrders.length} orders (including delivered).`);

        // Map to LeanOrder, ensuring correct types (string IDs, ISO date strings)
        // Add checks for potentially null/undefined values during mapping
        return kanbanOrders.map((order): LeanOrder => {
             if (!order._id || !order.createdAt || !order.updatedAt) {
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
        console.error("Kanban: Failed to fetch or process orders:", error);
        // Re-throw the error to be caught by Next.js error boundaries or the page component
        throw error;
    }
}

export default async function KitchenBoardPage() {
    let initialOrders: LeanOrder[] = [];
    let fetchError: string | null = null;

    try {
        console.log("Fetching orders for Kanban Page...");
        initialOrders = await getKanbanOrders();
        console.log("Successfully fetched orders for Kanban Page.");
    } catch (error) {
        console.error("Error fetching initial orders for Kanban Page:", error);
        fetchError = error instanceof Error ? error.message : "An unknown error occurred fetching orders.";
    }

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-3xl font-bold mb-6">Kitchen Kanban Board</h1>

            {/* Render error message if fetching failed */}
            {fetchError && (
                 <div className="text-destructive bg-destructive/10 p-4 rounded-md mb-4">
                     <p className='font-bold'>Error loading orders:</p>
                     <p>{fetchError}</p>
                     <p className='mt-2 text-sm'>Please check the server logs and database connection.</p>
                 </div>
            )}

            {/* Pass initial orders (possibly empty) to the client component */}
            {/* KitchenKanbanClientPage should handle the case where initialOrders is empty */}
            <KitchenKanbanClientPage initialOrders={initialOrders} />
        </div>
    );
}

// Ensure fresh data for the board
export const dynamic = 'force-dynamic';
// app/api/orders/[orderId]/route.ts

import { NextResponse, NextRequest } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import Order, { IOrder } from '@/models/Order'; // Import Order model and IOrder interface

// Define the expected shape of the PATCH request body
interface UpdateOrderPayload {
    status?: IOrder['status']; // Optional status update
    assignedTo?: string | null; // Optional assignment update (allow null to unassign)
}


export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ orderId: string }> } // Access route parameters
    
) {
    // Removed immediate destructuring:     const { orderId } = params;

    const { orderId } = await params;

    // 1. Validate ObjectId using params.orderId
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
        return NextResponse.json({ message: 'Invalid Order ID format' }, { status: 400 });
    }

    // 2. Connect to DB
    await dbConnect();

    try {
        // 3. Parse Request Body
        const body: UpdateOrderPayload = await request.json();
        const { status, assignedTo } = body;

        // 4. Basic Validation for payload
        if (!status && assignedTo === undefined) {
             return NextResponse.json({ message: 'No update fields provided (status or assignedTo).' }, { status: 400 });
        }

        // 5. Construct update object selectively
        const updateData: Partial<UpdateOrderPayload> = {};
        if (status) {
            // Explicitly define the allowed statuses (must match your Order schema enum)
            const allowedStatuses = ['Pending', 'Confirmed', 'InProgress', 'Ready', 'Delivered', 'Cancelled', 'Refunded'] as const;
            type OrderStatus = typeof allowedStatuses[number];
            function isValidStatus(value: string): value is OrderStatus {
                return allowedStatuses.includes(value as OrderStatus);
            }
            if (!isValidStatus(status)) {
                 return NextResponse.json({ message: `Invalid status value: '${status}'. Allowed statuses are: ${allowedStatuses.join(', ')}` }, { status: 400 });
             }
            updateData.status = status;
        }
        if (assignedTo !== undefined) {
             updateData.assignedTo = assignedTo === '' ? null : assignedTo; // Treat empty string as null/clear
        }

        // 6. Find and Update Order using orderId
        const updatedOrder = await Order.findByIdAndUpdate(
            orderId, // Use orderId directly
            { $set: updateData },
            { new: true, runValidators: true }
        );

        // 7. Handle Not Found
        if (!updatedOrder) {
            return NextResponse.json({ message: 'Order not found' }, { status: 404 });
        }

        // Log using orderId
        console.log(`Order ${orderId} updated:`, updateData);

        // 8. Return Success Response
        return NextResponse.json(updatedOrder, { status: 200 });

    } catch (error) {
        // Log error using orderId
        console.error(`Error updating order ${orderId}:`, error);
        let errorMessage = 'Failed to update order.';
        let statusCode = 500;

        if (error instanceof Error) {
            errorMessage = error.message;
            if (error.name === 'ValidationError') {
                statusCode = 400;
            }
        }
         if (error instanceof SyntaxError) {
             errorMessage = 'Invalid JSON payload.';
             statusCode = 400;
         }

        return NextResponse.json(
            { message: errorMessage, error: error instanceof Error ? error.message : String(error) },
            { status: statusCode }
        );
    }
}


// Optional: Add GET handler to fetch a single order by ID if needed later
export async function GET(
    request: NextRequest,
     { params }: { params: Promise<{ orderId: string }> } // // Use 'context' instead of destructuring
  ) {
    const { orderId } = await params;  // Then extract orderId from context.params
    
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return NextResponse.json({ message: 'Invalid Order ID format' }, { status: 400 });
    }
    
    await dbConnect();
    try {
      const order = await Order.findById(orderId);
      if (!order) {
        return NextResponse.json({ message: 'Order not found' }, { status: 404 });
      }
      return NextResponse.json(order, { status: 200 });
    } catch (error) {
      console.error(`Error fetching order ${orderId}:`, error);
      return NextResponse.json({ message: 'Failed to fetch order' }, { status: 500 });
    }
  }

// Add DELETE or other methods if needed, returning 405 for now
// export async function DELETE(...) { ... }
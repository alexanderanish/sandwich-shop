// app/api/orders/route.ts (POST Handler only)

import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import MenuItem from '@/models/MenuItem';
// Use simpler CartItem type (no ComboDetails)
import { CartItem } from '@/types';

export async function POST(request: Request) {
    await dbConnect();
    let session: mongoose.ClientSession | null = null;

    try {
        session = await mongoose.startSession();
        session.startTransaction();
        console.log("API: Transaction started.");

        const body = await request.json();
        // Use simpler CartItem type here
        const { items, customerName, customerPhone, totalAmount } = body as {
            items: CartItem[],
            customerName?: string,
            customerPhone?: string,
            totalAmount: number
        };

        // --- Validation ---
        if (!items || !Array.isArray(items) || items.length === 0 || totalAmount == null || totalAmount < 0) {
            throw new Error('Invalid or empty order items provided.');
        }

        // --- Process items: Prepare OrderItems and Stock Updates (No Combo Logic)---
        const orderItemsForSchema = [];
        const stockUpdatePromises = [];

        for (const item of items) {
             if (!item.menuItemId || !item.quantity || item.quantity <= 0 || item.price == null || !mongoose.Types.ObjectId.isValid(item.menuItemId)) {
                 throw new Error(`Invalid data for cart item: ${item.name || item.menuItemId}`);
             }

             // Prepare stock update for the direct menuItemId
             stockUpdatePromises.push(
                 MenuItem.findOneAndUpdate(
                     { _id: new mongoose.Types.ObjectId(item.menuItemId), currentStock: { $gte: item.quantity } },
                     { $inc: { currentStock: -item.quantity } },
                     { new: true, session }
                 ).exec()
             );

             // Prepare data for the Order document sub-item (no comboDetails)
             orderItemsForSchema.push({
                menuItemId: new mongoose.Types.ObjectId(item.menuItemId),
                name: item.name,
                quantity: item.quantity,
                pricePerItem: item.price,
                overriddenPricePerItem: item.overriddenPrice,
                // No comboDetails here
             });
        } // End loop

        // --- Execute Stock Updates ---
        if (stockUpdatePromises.length > 0) {
             console.log(`API: Performing ${stockUpdatePromises.length} stock update operations...`);
             const updatedStockResults = await Promise.all(stockUpdatePromises);

             if (updatedStockResults.some(result => result === null)) {
                 // Find which item failed
                 for (let i = 0; i < items.length; i++) {
                    if (updatedStockResults[i] === null) {
                        const failedItemInfo = await MenuItem.findById(items[i].menuItemId).select('name currentStock').session(session).lean();
                        throw new Error(`Insufficient stock for item: ${failedItemInfo?.name ?? items[i].menuItemId}. Available: ${failedItemInfo?.currentStock ?? 0}.`);
                    }
                 }
                 throw new Error('Insufficient stock detected during final update.'); // Fallback
             }
             console.log("API: Stock updated successfully.");
        }

        // --- Create and Save Order (as before, but items lack comboDetails) ---
         const newOrder = new Order({
             customerName: customerName || undefined,
             customerPhone: customerPhone || undefined,
             items: orderItemsForSchema, // No comboDetails in items
             totalAmount: totalAmount,
             status: 'Confirmed',
             paymentReceived: true,
             assignedTo: undefined,
         });
         const savedOrder = await newOrder.save({ session });
         console.log("API: Order saved successfully:", savedOrder._id);

        // --- Commit Transaction ---
        await session.commitTransaction();
        console.log("API: Transaction committed.");

        // --- Return Success ---
        return NextResponse.json(savedOrder, { status: 201 });

    } catch (error) {
        // --- Error Handling & Abort (as before) ---
         console.error("API: Error processing order:", error); if (session && session.inTransaction()) { try { await session.abortTransaction(); console.log("API: Transaction aborted due to error."); } catch (abortError) { console.error("API: Error aborting transaction:", abortError); } } let errorMessage = 'Failed to create order due to an unexpected error.'; let statusCode = 500; if (error instanceof Error) { if (error.message.startsWith('Insufficient stock') || error.message.startsWith('Invalid data') || error.message.includes('not found') || error.name === 'ValidationError' ) { errorMessage = error.message; statusCode = 400; } else { errorMessage = error.message; } } if (error instanceof SyntaxError) { errorMessage = 'Invalid JSON payload.'; statusCode = 400; }
         return NextResponse.json( { message: errorMessage, error: error instanceof Error ? error.message : String(error) }, { status: statusCode } );
    } finally {
        // --- End Session ---
         if (session) { session.endSession(); }
    }
}

// GET handler can remain the same
// export async function GET(...) { ... }
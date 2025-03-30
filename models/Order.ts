// models/Order.ts
import mongoose, { Schema, Document, models, Model } from 'mongoose';

// Interface for subdocument (no comboDetails)
export interface IOrderItem {
  menuItemId: mongoose.Schema.Types.ObjectId;
  name: string;
  quantity: number;
  pricePerItem: number;
  overriddenPricePerItem?: number;
  // No comboDetails here
}

// Interface for main document (unchanged)
export interface IOrder extends Document {
  customerName?: string;
  customerPhone?: string;
  items: IOrderItem[];
  totalAmount: number;
  status: 'Pending' | 'Confirmed' | 'InProgress' | 'Ready' | 'Delivered' | 'Cancelled' | 'Refunded';
  assignedTo?: string | null;
  paymentReceived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Subdocument schema (no comboDetails)
const OrderItemSchema: Schema<IOrderItem> = new Schema({
  menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true, },
  name: { type: String, required: true, },
  quantity: { type: Number, required: true, min: [1, 'Quantity must be at least 1.'], },
  pricePerItem: { type: Number, required: true, min: [0, 'Price per item cannot be negative.'], },
  overriddenPricePerItem: { type: Number, min: [0, 'Overridden price cannot be negative.'], required: false, },
  // No comboDetails field here
}, {_id: false});

// Main order schema (unchanged)
const OrderSchema: Schema<IOrder> = new Schema(
  {
    customerName: { type: String, trim: true, },
    customerPhone: { type: String, trim: true, },
    items: {
      type: [OrderItemSchema],
      required: true,
      validate: [ (v: IOrderItem[]) => v.length > 0, 'Order must contain at least one item.']
    },
    totalAmount: { type: Number, required: true, min: [0, 'Total amount cannot be negative.'], },
    status: {
      type: String,
      required: true,
      enum: ['Pending', 'Confirmed', 'InProgress', 'Ready', 'Delivered', 'Cancelled', 'Refunded'],
      default: 'Pending',
    },
    assignedTo: { type: String, trim: true, default: null },
    paymentReceived: { type: Boolean, default: false, },
  },
  { timestamps: true, }
);

const Order: Model<IOrder> = models.Order || mongoose.model<IOrder>('Order', OrderSchema);
export default Order;
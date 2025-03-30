// types/index.ts
// import { Types } from 'mongoose';
import { MenuItemInput } from '@/models/MenuItem';
import { IOrder } from '@/models/Order';

// Cart item type (before combo)
export interface CartItem {
  menuItemId: string;
  name: string;
  price: number; // Original price per item
  quantity: number;
  image?: string;
  overriddenPrice?: number; // Optional overridden price per item
  // No comboDetails here
}

// Lean menu item type (before combo)
export type LeanMenuItem = MenuItemInput & {
    _id: string;
    // No isComboBase here
};

// Lean order item type (before combo)
export interface LeanOrderItem {
    menuItemId: string; // ObjectId converted to string
    name: string;
    quantity: number;
    pricePerItem: number;
    overriddenPricePerItem?: number;
    // No comboDetails here
}

// Lean order type (before combo)
export interface LeanOrder {
    _id: string;
    customerName?: string;
    customerPhone?: string;
    items: LeanOrderItem[]; // Uses simple LeanOrderItem
    totalAmount: number;
    status: IOrder['status'];
    assignedTo?: string | null;
    paymentReceived: boolean;
    createdAt: string; // Date converted to ISO string
    updatedAt: string; // Date converted to ISO string
}
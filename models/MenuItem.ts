// models/MenuItem.ts
import mongoose, { Schema, Document, models, Model } from 'mongoose';

// Interface for the raw input data (plain object)
export interface MenuItemInput {
  name: string;
  description: string;
  price: number;
  images?: string[];
  vegetarian: boolean;
  allergens?: string[];
  ingredients?: string[];
  category: string;
  initialStock: number;
  currentStock: number;
  // No isComboBase field here
}

// Interface for the Mongoose Document (includes Document methods + our data)
export interface IMenuItem extends MenuItemInput, Document {
  createdAt: Date;
  updatedAt: Date;
}

// Schema definition
const MenuItemSchema: Schema<IMenuItem> = new Schema(
  {
    name: { type: String, required: [true, 'Please provide a name for the menu item.'], trim: true },
    description: { type: String, required: [true, 'Please provide a description.'], trim: true },
    price: { type: Number, required: [true, 'Please provide a price.'], min: [0, 'Price cannot be negative.'] },
    images: { type: [String], default: [] },
    vegetarian: { type: Boolean, required: true },
    allergens: { type: [String], default: [] },
    ingredients: { type: [String], default: [] },
    category: { type: String, required: [true, 'Please specify a category.'], trim: true },
    initialStock: { type: Number, required: [true, 'Please provide initial stock count.'], min: [0, 'Stock cannot be negative.'], default: 0 },
    currentStock: { type: Number, required: [true, 'Please provide current stock count.'], min: [0, 'Stock cannot be negative.'], default: 0 },
    // No isComboBase field here
  },
  {
    timestamps: true,
  }
);

const MenuItem: Model<IMenuItem> = models.MenuItem || mongoose.model<IMenuItem>('MenuItem', MenuItemSchema);
export default MenuItem;
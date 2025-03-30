// app/cashier/page.tsx
import dbConnect from '@/lib/mongodb';
import MenuItem from '@/models/MenuItem';
import CashierClientPage from '@/components/CashierClientPage';
import { LeanMenuItem } from '@/types'; // Import the LeanMenuItem type

async function getMenuItems(): Promise<LeanMenuItem[]> {
  await dbConnect();
  try {
    const menuItems = await MenuItem.find({})
      .sort({ category: 1, name: 1 })
      .lean() // Use lean()
      .exec();

    // Map to the LeanMenuItem structure, ensuring _id is string and types are correct
     return menuItems.map(item => ({
       ...item, // Spread the lean object first
       _id: item._id.toString(), // Explicitly convert ObjectId to string
       price: Number(item.price ?? 0), // Ensure price is a number, default if null/undefined
       currentStock: Number(item.currentStock ?? 0), // Ensure stock is number
       initialStock: Number(item.initialStock ?? 0), // Ensure stock is number
       // Ensure other fields match LeanMenuItem (which inherits MenuItemInput)
       name: item.name,
       description: item.description,
       images: item.images,
       vegetarian: item.vegetarian,
       allergens: item.allergens,
       ingredients: item.ingredients,
       category: item.category,
    })) as LeanMenuItem[]; // Assert the final mapped array type

  } catch (error) {
    console.error('Failed to fetch menu items:', error);
    return []; // Return empty array on error
  }
}

export default async function CashierPage() {
  const initialMenuItems = await getMenuItems();

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Cashier - New Order</h1>
      {/* Pass data to the client component wrapper */}
      <CashierClientPage initialMenuItems={initialMenuItems} />
    </div>
  );
}

// Consider adding revalidation or dynamic fetching if menu changes often
// export const revalidate = 60; // e.g., Revalidate every 60 seconds
// export const dynamic = 'force-dynamic';
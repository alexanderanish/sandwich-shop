// scripts/seedDb.ts
import dotenv from 'dotenv';

// Configure dotenv at the VERY TOP
dotenv.config({ path: '.env.local' });

// NOW import modules that rely on the loaded environment variables
import mongoose from 'mongoose';
import dbConnect from '../lib/mongodb'; // Now dbConnect will find the loaded MONGODB_URI
import MenuItem, { MenuItemInput } from '../models/MenuItem';


// --- Rest of your script remains the same ---

const initialMenuItemsData: MenuItemInput[] = [
    {
        name: 'Nala',
        description: "The Nala features pork solantulem from Nihal's mum's recipe, cooked with kokum and spices. The sandwich is balanced with spicy Kasundi mustard, sweet apple jam, salted cucumber, lettuce, and creamy homemade mayonnaise.",
        price: 400,
        images: ['/pork_1.jpg', '/pork_2.jpg', '/pork_3.jpg'],
        vegetarian: false,
        allergens: ["Pork", "Egg", "Mustard Seeds"],
        ingredients: ['Pork Solantulem (Kokum)', 'Homemade Mayonaise', 'Kasundi Mustard', 'Cucumber', 'Lettuce leaves', 'Spiced Apple Jam', 'Baguette'],
        category: 'Sandwich',
        initialStock: 25,
        currentStock: 25,
      },
      {
        name: 'Rafiki',
        description: "If you love lemongrass, this sandwich is for you. It includes grilled chicken in a green chilli and lemongrass marinade, lemongrass labneh, pickled carrots, radish, salted cucumbers, and basil leaves for a punchy, spicy flavor.",
        price: 400,
        images: ['/chicken_1.jpg', '/chicken_2.jpg', '/chicken_3.jpg','/chicken_4.jpg', '/chicken_5.jpg', '/chicken_6.jpg'],
        vegetarian: false,
        allergens: ["Lemongrass", "Chicken", "Fish Sauce", "Soy Sauce", "Curd"],
        ingredients: ['Green Chilli and Lemongrass Chicken', 'Pickled Carrot and Radish', 'Salted Cucumber', 'Lemongrass Labneh', 'Fish Sauce', 'Soy Sauce', 'Baguette'],
        category: 'Sandwich',
        initialStock: 40,
        currentStock: 40,
      },
      {
        name: 'Jazz',
        description: "The Jazz is a vegetarian Middle Eastern sandwich with smoky baked tahini eggplant, homemade hummus, labneh, garlic toum, spiced tomato jam, basil leaves, and homemade mozzarella.",
        price: 350,
        images: ['/veg_1.jpg', '/veg_2.jpg', '/veg_3.jpg', '/veg_4.jpg'],
        vegetarian: true,
        allergens: ["Eggplant", "Sesame Seeds", "Chickpeas", "Milk", "Curd"],
        ingredients: ['Baked Tahini Eggplant', 'Hummus', 'Labneh', 'Garlic Toum', 'Spiced Tomato Jam', 'Mozarella','Basil Leaves','Baguette'],
        category: 'Sandwich',
        initialStock: 60,
        currentStock: 60,
      },
      {
        name: 'Lorry',
        description: "Goan Beef Roast. Kasundi Mustard. Jiardenera. Kewpie Mayo. French Baguette.",
        price: 400,
        images: ['/pork_new_1.JPG'],
        vegetarian: false,
        allergens: ["Pork", "Mustard Seeds", "Egg", "Mayonnaise"],
        ingredients: ['Goan Pork Roast', 'Kasundi Mustard', 'Jiardenera', 'Kewpie Mayo', 'French Baguette'],
        category: 'Sandwich',
        initialStock: 25,
        currentStock: 25,
      },
      {
        name: 'Pastel de Nata',
        description: 'Portuguese egg custard tart pastry. (Sold individually)',
        price: 50,
        images: ['/pastel_de_nata_placeholder.jpg'],
        vegetarian: true,
        allergens: ["Egg", "Milk", "Wheat"],
        ingredients: ['Egg', 'Milk', 'Sugar', 'Flour', 'Butter', 'Cinnamon'],
        category: 'Side',
        initialStock: 50,
        currentStock: 50,
      },
      {
        name: 'Lemonade',
        description: 'Refreshing homemade lemonade.',
        price: 100,
        images: ['/lemonade_placeholder.jpg'],
        vegetarian: true,
        allergens: [],
        ingredients: ['Lemon Juice', 'Water', 'Sugar'],
        category: 'Drink',
        initialStock: 100,
        currentStock: 100,
      }
];

const seedDatabase = async () => {
  try {
    console.log('Connecting to database...');
    await dbConnect();
    console.log('Database connected.');

    console.log('Clearing existing MenuItem data...');
    await MenuItem.deleteMany({});
    console.log('Existing MenuItem data cleared.');

    console.log('Inserting seed data...');
    await MenuItem.insertMany(initialMenuItemsData);
    console.log('Seed data inserted successfully!');

  } catch (error) {
    console.error('Error seeding database:', error);
     if (error instanceof mongoose.Error.ValidationError) {
             console.error('Validation Errors:', error.errors);
        }
  } finally {
    console.log('Closing database connection...');
     if (mongoose.connection.readyState === 1) { // 1 === connected
           await mongoose.connection.close();
           console.log('Database connection closed.');
        } else {
           console.log('Database connection already closed or not established.');
        }
  }
};

seedDatabase();
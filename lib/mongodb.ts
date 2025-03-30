// lib/mongodb.ts
import mongoose from 'mongoose';

// Define the expected structure for our cached mongoose connection/promise
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Augment the NodeJS global type to include our mongoose cache definition
declare global {
  // eslint-disable-next-line no-var
  var mongoose: MongooseCache;
}

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  // This check runs when the module is loaded.
  // Ensure dotenv runs before this module is imported in scripts.
  console.warn('MONGODB_URI not found at module load time. Ensure .env is loaded before importing mongodb.ts');
  // We throw error only inside dbConnect now if still missing.
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
// Initialize the cache if it doesn't exist
if (!global.mongoose) {
  global.mongoose = { conn: null, promise: null };
}
const cached = global.mongoose;


async function dbConnect(): Promise<typeof mongoose> {
    // Added check inside the function too for robustness
    if (!MONGODB_URI) {
      throw new Error(
        'Please define the MONGODB_URI environment variable inside .env.local'
      );
    }

    if (cached.conn) {
      // console.log(' MONGODB: Using cached connection'); // Reduce console noise
      return cached.conn;
    }

    if (!cached.promise) {
      const opts = {
        bufferCommands: false,
        // Add other options recommended by MongoDB driver if needed
        // useNewUrlParser: true, // Deprecated
        // useUnifiedTopology: true, // Deprecated
      };

      console.log(' MONGODB: Creating new connection');
      cached.promise = mongoose.connect(MONGODB_URI!, opts).then((mongooseInstance) => {
        console.log(' MONGODB: Connection successful');
        return mongooseInstance;
      }).catch(error => {
          console.error(' MONGODB: Connection failed', error);
          cached.promise = null; // Reset promise on error
          throw error;
      });
    }

    try {
      cached.conn = await cached.promise;
    } catch (e) {
      cached.promise = null;
      throw e;
    }

    if (!cached.conn) {
        throw new Error(" MONGODB: Connection object is null after attempting connection.");
    }

    return cached.conn;
}

export default dbConnect;
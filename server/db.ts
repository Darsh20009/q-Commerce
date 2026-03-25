import mongoose from "mongoose";

if (!process.env.MONGODB_URI) {
  if (process.env.NODE_ENV === "production") {
    console.warn("Warning: MONGODB_URI is not set. Database operations will fail.");
  }
}

let isConnected = false;

export function getIsConnected() {
  return isConnected;
}

async function tryConnect(uri: string): Promise<boolean> {
  try {
    // Disconnect first if there's a stale connection
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 8000,
      socketTimeoutMS: 20000,
      bufferCommands: false,
    });
    isConnected = true;
    console.log("Connected to MongoDB successfully");
    return true;
  } catch (err: any) {
    console.error("MongoDB connection attempt failed:", err?.message?.split('\n')[0] || err);
    return false;
  }
}

export async function connectDB() {
  if (isConnected) return;
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI must be set.");
  }

  const uri = process.env.MONGODB_URI!;

  let connected = await tryConnect(uri);

  if (!connected) {
    console.log("Retrying MongoDB connection in 3 seconds...");
    await new Promise(r => setTimeout(r, 3000));
    connected = await tryConnect(uri);
  }

  if (!connected) {
    console.warn("=== MongoDB unavailable. App will start without DB. Whitelist 0.0.0.0/0 in Atlas Network Access. ===");
    // Set bufferCommands false so operations fail fast instead of timing out and crashing
    mongoose.set('bufferCommands', false);
  }
}

export default mongoose;

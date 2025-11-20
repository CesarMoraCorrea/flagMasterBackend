import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

let cached = global.__mongoose;
if (!cached) cached = global.__mongoose = { conn: null, promise: null, mem: null };

export async function connectDB() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    let uri = process.env.MONGODB_URI;
    if (!uri) {
      if (!cached.mem) cached.mem = await MongoMemoryServer.create();
      uri = cached.mem.getUri();
      process.env.MONGODB_URI = uri;
    }
    cached.promise = mongoose.connect(uri, { maxPoolSize: 5 }).then((m) => m);
  }
  cached.conn = await cached.promise;
  return cached.conn;
}
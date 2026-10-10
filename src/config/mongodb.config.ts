import mongoose from 'mongoose';

class Database {
  async connectDb(): Promise<void> {
    try {
      const conn = await mongoose.connect(
        process.env.MONGO_URI || 'mongodb://localhost:27017/mycarsol'
      );
      console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error: any) {
      console.error(`MongoDB Connection Error: ${error.message}`);
      process.exit(1);
    }
  }
}

export default Database;

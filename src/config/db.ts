import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/sweet-shop';

    await mongoose.connect(mongoURI);
    console.log('MongoDB Connected...');
  } catch (err) {
    console.error((err as Error).message);
    // Exit process with failure
    process.exit(1);
  }
};

export default connectDB;
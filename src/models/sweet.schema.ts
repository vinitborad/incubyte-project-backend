import { Schema } from 'mongoose';

// Define the interface for our Sweet document
export interface ISweet extends Document {
  name: string;
  category: string;
  price: number;
  quantity: number;
}

// Define the Mongoose schema
export const sweetSchema = new Schema<ISweet>({
  name: { type: String, required: true },
  category: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
});
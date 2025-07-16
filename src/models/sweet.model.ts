import { model } from 'mongoose';
import { ISweet, sweetSchema } from './sweet.schema';

// Create and export the Mongoose model
export const SweetModel = model<ISweet>('Sweet', sweetSchema);
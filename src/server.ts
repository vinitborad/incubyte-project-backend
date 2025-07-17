import dotenv from 'dotenv';
import { app } from './app';
import connectDB from './config/db';

// Load environment variables
dotenv.config();

// Connect to the database
connectDB();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
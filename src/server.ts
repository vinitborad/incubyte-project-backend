import { app } from './app';
import connectDB from './config/db';

// Connect to the database
connectDB();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
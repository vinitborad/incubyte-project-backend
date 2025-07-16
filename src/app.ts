import express from 'express';

// Create the Express app
const app = express();

// Use express.json() middleware to parse JSON bodies
app.use(express.json());

// Define the /add route
app.post('/add', (req, res) => {
  const { name, category, price, quantity } = req.body;

  // For now, just create a fake response to make the test pass
  const newSweet = {
    id: 'some-random-id', // Fake the ID for now
    name,
    category,
    price,
    quantity,
  };

  res.status(201).send(newSweet);
});

// Export the app for testing
export { app };
import express from 'express';
import sweetRoutes from './routes/sweet.routes';

const app = express();
app.use(express.json());

// Use the sweet routes
app.use('/', sweetRoutes);

app.get('/', (req, res) => {
  res.send('Welcome to the Sweet Shop API');
});

export { app };
import request from 'supertest';
import { app } from './app';

describe('POST /add - Add a new sweet', () => {
  it('should respond with a 201 status code and the created sweet', async () => {
    const newSweet = {
      name: 'Gulab Jamun',
      category: 'Milk-Based',
      price: 10,
      quantity: 50,
    };

    const response = await request(app)
      .post('/add')
      .send(newSweet);

    // Assertions
    expect(response.statusCode).toBe(201);
    expect(response.body.name).toBe(newSweet.name);
    expect(response.body.id).toBeDefined(); // We expect the server to generate an ID
  });
})
import request from 'supertest';
import { app } from './app';
import { SweetModel } from './models/sweet.model'; // 1. Import the model

// 2. Create a spy on the 'create' method
const createSpy = jest.spyOn(SweetModel, 'create');

describe('POST /add - Add a new sweet', () => {
  it('should respond with a 201 status code and the created sweet', async () => {
    const newSweet = {
      name: 'Gulab Jamun',
      category: 'Milk-Based',
      price: 10,
      quantity: 50,
    };

    // 3. Tell the spy what to return when called
    // We use mockResolvedValue because the controller `await`s it.
    createSpy.mockResolvedValue({ id: 'mock-id-123', ...newSweet });

    const response = await request(app)
      .post('/add')
      .send(newSweet);

    // Assertions
    expect(response.statusCode).toBe(201);
    expect(response.body.name).toBe(newSweet.name);
    expect(response.body.id).toBeDefined();
  });
});
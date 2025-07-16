import request from 'supertest';
import { app } from './app';
import * as db from './test-utils/db-handler'; // Import our handler
import { SweetModel } from './models/sweet.model';

// Connect to the test database before all tests in this file
beforeAll(async () => await db.connect());

// Clear the database before each test
beforeEach(async () => await db.clearDatabase());

// Disconnect from the database after all tests in this file
afterAll(async () => await db.closeDatabase());

describe('POST /add', () => {
  it('should create a sweet successfully in the database', async () => {
    const newSweet = {
      name: 'Jalebi',
      category: 'Syrup-Based',
      price: 20,
      quantity: 30,
    };

    // Act: Make the API call
    await request(app).post('/add').send(newSweet).expect(201);

    // Assert: Check that the sweet was actually saved to the database
    const sweetFromDb = await SweetModel.findOne({ name: 'Jalebi' });
    expect(sweetFromDb).not.toBeNull();
    expect(sweetFromDb?.name).toBe(newSweet.name);
  });
});
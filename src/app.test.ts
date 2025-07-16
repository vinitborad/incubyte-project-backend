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

describe('GET /view', () => {
  it('should return an array of all sweets in the database', async () => {
    // Arrange: Create some sweets in the test database first
    const sweet1 = { name: 'Kaju Katli', category: 'Nut-Based', price: 50, quantity: 20 };
    const sweet2 = { name: 'Gajar Halwa', category: 'Vegetable-Based', price: 30, quantity: 15 };
    await SweetModel.create([sweet1, sweet2]);

    // Act: Make the API call
    const response = await request(app).get('/view').expect(200);

    // Assert: Check the response body
    expect(response.body).toBeInstanceOf(Array);
    expect(response.body.length).toBe(2);
    expect(response.body[0].name).toBe('Kaju Katli');
    expect(response.body[1].name).toBe('Gajar Halwa');
  });
});

describe('DELETE /delete/:id', () => {
  it('should delete a sweet from the database', async () => {
    // Arrange: Create a sweet to delete
    const sweet = await SweetModel.create({
      name: 'Rasmalai',
      category: 'Milk-Based',
      price: 40,
      quantity: 25,
    });
    const sweetId = sweet._id.toString();

    // Act: Make the API call to delete the sweet
    await request(app).delete(`/delete/${sweetId}`).expect(200);

    // Assert: Check that the sweet is no longer in the database
    const sweetFromDb = await SweetModel.findById(sweetId);
    expect(sweetFromDb).toBeNull();
  });
});
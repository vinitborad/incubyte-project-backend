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

  it('should return 400 if required fields are missing', async () => {
    const response = await request(app)
      .post('/add')
      .send({ name: 'Incomplete' });

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe('Missing required fields');
  });

  it('should return 400 if a sweet with the same name exists', async () => {
    // Arrange: create an initial sweet
    const sweet = { name: 'Duplicate Sweet', category: 'Test', price: 10, quantity: 10 };
    await SweetModel.create(sweet);

    // Act & Assert: try to create it again
    const response = await request(app).post('/add').send(sweet);
    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe('A sweet with this name already exists');
  });
});


describe('GET /view', () => {
  it('should return an array of all sweets in the database', async () => {
    // Arrange: Create some sweets in the test database first
    const sweet1 = { name: 'Kaju Katli', category: 'Nut-Based', price: 50, quantity: 20 };
    const sweet2 = { name: 'Gajar Halwa', category: 'Vegetable-Based', price: 30, quantity: 15 };
    await SweetModel.create([sweet1, sweet2]);

    // Act: Make the API call
    const response = await request(app).get('/view-all').expect(200);

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


describe('GET /search', () => {
  it('should return sweets matching a name query', async () => {
    // Arrange: Create sweets to search through
    await SweetModel.create([
      { name: 'Chocolate Cake', category: 'Cake', price: 350, quantity: 10 },
      { name: 'Chocolate Brownie', category: 'Pastry', price: 180, quantity: 15 },
      { name: 'Vanilla Muffin', category: 'Muffin', price: 150, quantity: 20 },
    ]);

    // Act: Make the API call to search for "Chocolate"
    const response = await request(app).get('/search?name=Chocolate').expect(200);

    // Assert: Check that only the chocolate sweets are returned
    expect(response.body).toBeInstanceOf(Array);
    expect(response.body.length).toBe(2);
    expect(response.body[0].name).toContain('Chocolate');
    expect(response.body[1].name).toContain('Chocolate');
  });

  it('should return sweets matching a category query', async () => {
    // Arrange
    await SweetModel.create([
      { name: 'Chocolate Cake', category: 'Cake', price: 350, quantity: 10 },
      { name: 'Vanilla Muffin', category: 'Muffin', price: 150, quantity: 20 },
      { name: 'Strawberry Cake', category: 'Cake', price: 400, quantity: 5 },
    ]);

    // Act
    const response = await request(app).get('/search?category=Cake').expect(200);

    // Assert
    expect(response.body.length).toBe(2);
    expect(response.body[0].category).toBe('Cake');
    expect(response.body[1].category).toBe('Cake');
  });

  it('should return sweets within a given price range', async () => {
    // Arrange
    await SweetModel.create([
      { name: 'Ladoo', category: 'Gram Flour', price: 10, quantity: 50 },
      { name: 'Barfi', category: 'Milk-Based', price: 25, quantity: 30 },
      { name: 'Mysore Pak', category: 'Gram Flour', price: 40, quantity: 20 },
    ]);

    // Act
    const response = await request(app)
      .get('/search?minPrice=20&maxPrice=45')
      .expect(200);

    // Assert
    expect(response.body.length).toBe(2);

    // Create an array of the names from the response
    const names = response.body.map((sweet: { name: string }) => sweet.name);

    // Check that the expected names are included in the array, in any order
    expect(names).toContain('Barfi');
    expect(names).toContain('Mysore Pak');
  });
});


describe('POST /purchase/:id', () => {
  it('should decrease the quantity of a sweet after a purchase', async () => {
    // Arrange: Create a sweet with an initial quantity
    const sweet = await SweetModel.create({
      name: 'Motichoor Ladoo',
      category: 'Gram Flour',
      price: 15,
      quantity: 100,
    });
    const sweetId = sweet._id.toString();
    const purchaseQuantity = 10;

    // Act: Make the API call to purchase the sweet
    const response = await request(app)
      .post(`/purchase/${sweetId}`)
      .send({ quantity: purchaseQuantity })
      .expect(200);

    // Assert: Check the response and the database
    expect(response.body.message).toBe('Purchase successful');

    const updatedSweet = await SweetModel.findById(sweetId);
    expect(updatedSweet?.quantity).toBe(90); // 100 - 10
  });

  it('should return a 400 error if the purchase quantity exceeds the stock', async () => {
    // Arrange: Create a sweet with a low quantity
    const sweet = await SweetModel.create({
      name: 'Petha',
      category: 'Fruit-Based',
      price: 20,
      quantity: 5, // Only 5 in stock
    });
    const sweetId = sweet._id.toString();
    const purchaseQuantity = 10; // Trying to buy 10

    // Act & Assert
    const response = await request(app)
      .post(`/purchase/${sweetId}`)
      .send({ quantity: purchaseQuantity })
      .expect(400); // Expecting a "Bad Request" status

    expect(response.body.message).toBe('Insufficient stock');

    // Also assert that the quantity in the database did NOT change
    const sweetFromDb = await SweetModel.findById(sweetId);
    expect(sweetFromDb?.quantity).toBe(5);
  });

  it('should return 400 if the purchase quantity is not provided', async () => {
    // Arrange: Create a sweet
    const sweet = await SweetModel.create({ name: 'Test Sweet', category: 'Test', price: 10, quantity: 10 });
    const sweetId = sweet._id.toString();

    // Act & Assert: Make the API call with an empty body
    const response = await request(app)
      .post(`/purchase/${sweetId}`)
      .send({}) // Sending an empty body
      .expect(400);

    expect(response.body.message).toBe('A positive purchase quantity is required');
  });

  it('should return 400 if the purchase quantity is not a positive number', async () => {
    // Arrange
    const sweet = await SweetModel.create({ name: 'Test Sweet', category: 'Test', price: 10, quantity: 10 });
    const sweetId = sweet._id.toString();

    // Act & Assert: Make the API call with a zero quantity
    const response = await request(app)
      .post(`/purchase/${sweetId}`)
      .send({ quantity: 0 }) // Sending a non-positive number
      .expect(400);

    expect(response.body.message).toBe('A positive purchase quantity is required');
  });
});


describe('POST /restock/:id', () => {
  it('should increase the quantity of a sweet after a restock', async () => {
    // Arrange: Create a sweet with an initial quantity
    const sweet = await SweetModel.create({
      name: 'Sohan Papdi',
      category: 'Flaky',
      price: 35,
      quantity: 10,
    });
    const sweetId = sweet._id.toString();
    const restockQuantity = 50;

    // Act: Make the API call to restock the sweet
    const response = await request(app)
      .post(`/restock/${sweetId}`)
      .send({ quantity: restockQuantity })
      .expect(200);

    // Assert: Check the response and the database
    expect(response.body.message).toBe('Restock successful');

    const updatedSweet = await SweetModel.findById(sweetId);
    expect(updatedSweet?.quantity).toBe(60); // 10 + 50
  });

  it('should return 400 if the restock quantity is not provided', async () => {
    // Arrange
    const sweet = await SweetModel.create({ name: 'Test', category: 'Test', price: 1, quantity: 1 });
    const sweetId = sweet._id.toString();

    // Act & Assert
    const response = await request(app)
      .post(`/restock/${sweetId}`)
      .send({}) // Sending empty body
      .expect(400);

    expect(response.body.message).toBe('A positive restock quantity is required');
  });

  it('should return 400 if the restock quantity is not a positive number', async () => {
    // Arrange
    const sweet = await SweetModel.create({ name: 'Test', category: 'Test', price: 1, quantity: 1 });
    const sweetId = sweet._id.toString();

    // Act & Assert
    const response = await request(app)
      .post(`/restock/${sweetId}`)
      .send({ quantity: -5 }) // Sending non-positive number
      .expect(400);

    expect(response.body.message).toBe('A positive restock quantity is required');
  });
});


describe('GET /categories', () => {
  it('should return an array of unique sweet categories', async () => {
    // Arrange: Create sweets with duplicate categories
    await SweetModel.create([
      { name: 'Chocolate Cake', category: 'Cake', price: 350, quantity: 10 },
      { name: 'Vanilla Muffin', category: 'Muffin', price: 150, quantity: 20 },
      { name: 'Strawberry Cake', category: 'Cake', price: 400, quantity: 5 },
    ]);

    // Act: Make the API call
    const response = await request(app).get('/categories').expect(200);

    // Assert: Check that the response is a sorted array of unique categories
    expect(response.body).toBeInstanceOf(Array);
    expect(response.body.length).toBe(2);
    // Sort the result to have a predictable order for assertion
    const sortedCategories = response.body.sort();
    expect(sortedCategories).toEqual(['Cake', 'Muffin']);
  });
});
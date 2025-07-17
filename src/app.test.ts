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

  // Edge case: case-insensitive duplicate names
  it('should return 400 if a sweet with the same name exists (case-insensitive)', async () => {
    await SweetModel.create({ name: 'Chocolate Cake', category: 'Cake', price: 100, quantity: 10 });

    const response = await request(app)
      .post('/add')
      .send({ name: 'CHOCOLATE CAKE', category: 'Cake', price: 100, quantity: 10 });

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe('A sweet with this name already exists');
  });

  // Edge case: empty string values
  it('should return 400 if name is empty string', async () => {
    const response = await request(app)
      .post('/add')
      .send({ name: '', category: 'Test', price: 10, quantity: 5 });

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe('Missing required fields');
  });

  it('should return 400 if category is empty string', async () => {
    const response = await request(app)
      .post('/add')
      .send({ name: 'Test Sweet', category: '', price: 10, quantity: 5 });

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe('Missing required fields');
  });

  // Edge case: negative price
  it('should return 400 if price is negative', async () => {
    const response = await request(app)
      .post('/add')
      .send({ name: 'Negative Price Sweet', category: 'Test', price: -10, quantity: 5 });

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe('Price and quantity must be positive numbers');
  });

  // Edge case: zero price
  it('should return 400 if price is zero', async () => {
    const response = await request(app)
      .post('/add')
      .send({ name: 'Zero Price Sweet', category: 'Test', price: 0, quantity: 5 });

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe('Price and quantity must be positive numbers');
  });

  // Edge case: negative quantity
  it('should return 400 if quantity is negative', async () => {
    const response = await request(app)
      .post('/add')
      .send({ name: 'Negative Quantity Sweet', category: 'Test', price: 10, quantity: -5 });

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe('Price and quantity must be positive numbers');
  });

  // Edge case: zero quantity should be allowed
  it('should create a sweet with zero quantity successfully', async () => {
    const newSweet = {
      name: 'Out of Stock Sweet',
      category: 'Test',
      price: 10,
      quantity: 0,
    };

    await request(app).post('/add').send(newSweet).expect(201);

    const sweetFromDb = await SweetModel.findOne({ name: 'Out of Stock Sweet' });
    expect(sweetFromDb).not.toBeNull();
    expect(sweetFromDb?.quantity).toBe(0);
  });

  // Edge case: non-numeric price and quantity
  it('should return 400 if price is not a number', async () => {
    const response = await request(app)
      .post('/add')
      .send({ name: 'Invalid Price Sweet', category: 'Test', price: 'invalid', quantity: 5 });

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe('Price and quantity must be valid numbers');
  });

  it('should return 400 if quantity is not a number', async () => {
    const response = await request(app)
      .post('/add')
      .send({ name: 'Invalid Quantity Sweet', category: 'Test', price: 10, quantity: 'invalid' });

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe('Price and quantity must be valid numbers');
  });

  // Edge case: very large numbers
  it('should handle very large price values', async () => {
    const newSweet = {
      name: 'Expensive Sweet',
      category: 'Luxury',
      price: 999999,
      quantity: 1,
    };

    await request(app).post('/add').send(newSweet).expect(201);

    const sweetFromDb = await SweetModel.findOne({ name: 'Expensive Sweet' });
    expect(sweetFromDb?.price).toBe(999999);
  });

  // Edge case: very long name
  it('should handle very long sweet names', async () => {
    const longName = 'A'.repeat(1000);
    const newSweet = {
      name: longName,
      category: 'Test',
      price: 10,
      quantity: 5,
    };

    await request(app).post('/add').send(newSweet).expect(201);

    const sweetFromDb = await SweetModel.findOne({ name: longName });
    expect(sweetFromDb?.name).toBe(longName);
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

    // Create an array of just the names from the response
    const names = response.body.map((sweet: { name: string }) => sweet.name);

    // Check that the expected names are included in the array, in any order
    expect(names).toContain('Kaju Katli');
    expect(names).toContain('Gajar Halwa');
  });

  // Edge case: empty database
  it('should return an empty array when no sweets exist', async () => {
    const response = await request(app).get('/view-all').expect(200);

    expect(response.body).toBeInstanceOf(Array);
    expect(response.body.length).toBe(0);
  });

  // Edge case: large number of sweets
  it('should handle large number of sweets', async () => {
    const sweets = [];
    for (let i = 1; i <= 100; i++) {
      sweets.push({
        name: `Sweet ${i}`,
        category: `Category ${i % 10}`,
        price: i * 10,
        quantity: i
      });
    }
    await SweetModel.create(sweets);

    const response = await request(app).get('/view-all').expect(200);

    expect(response.body).toBeInstanceOf(Array);
    expect(response.body.length).toBe(100);
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

  // Edge case: invalid ID format
  it('should return 500 for invalid MongoDB ObjectId format', async () => {
    const response = await request(app).delete('/delete/invalid-id');
    expect(response.statusCode).toBe(500);
    expect(response.body.message).toBe('Error deleting sweet');
  });

  // Edge case: valid ObjectId format but non-existent ID
  it('should return 404 for non-existent but valid ObjectId', async () => {
    const nonExistentId = '507f1f77bcf86cd799439011'; // Valid ObjectId format
    const response = await request(app).delete(`/delete/${nonExistentId}`);
    expect(response.statusCode).toBe(404);
    expect(response.body.message).toBe('Sweet not found');
  });

  // Edge case: empty ID parameter
  it('should return 404 for empty ID parameter', async () => {
    const response = await request(app).delete('/delete/');
    expect(response.statusCode).toBe(404); // Express route won't match
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

  // Edge case: case-insensitive name search
  it('should perform case-insensitive name search', async () => {
    await SweetModel.create([
      { name: 'Chocolate Cake', category: 'Cake', price: 350, quantity: 10 },
      { name: 'Vanilla Muffin', category: 'Muffin', price: 150, quantity: 20 },
    ]);

    const response = await request(app).get('/search?name=CHOCOLATE').expect(200);

    expect(response.body.length).toBe(1);
    expect(response.body[0].name).toBe('Chocolate Cake');
  });

  // Edge case: no matches found
  it('should return empty array when no matches found', async () => {
    await SweetModel.create([
      { name: 'Chocolate Cake', category: 'Cake', price: 350, quantity: 10 },
    ]);

    const response = await request(app).get('/search?name=NonExistent').expect(200);

    expect(response.body).toBeInstanceOf(Array);
    expect(response.body.length).toBe(0);
  });

  // Edge case: only minPrice provided
  it('should search with only minimum price', async () => {
    await SweetModel.create([
      { name: 'Cheap Sweet', category: 'Test', price: 10, quantity: 10 },
      { name: 'Expensive Sweet', category: 'Test', price: 100, quantity: 10 },
    ]);

    const response = await request(app).get('/search?minPrice=50').expect(200);

    expect(response.body.length).toBe(1);
    expect(response.body[0].name).toBe('Expensive Sweet');
  });

  // Edge case: only maxPrice provided
  it('should search with only maximum price', async () => {
    await SweetModel.create([
      { name: 'Cheap Sweet', category: 'Test', price: 10, quantity: 10 },
      { name: 'Expensive Sweet', category: 'Test', price: 100, quantity: 10 },
    ]);

    const response = await request(app).get('/search?maxPrice=50').expect(200);

    expect(response.body.length).toBe(1);
    expect(response.body[0].name).toBe('Cheap Sweet');
  });

  // Edge case: combined filters
  it('should apply multiple filters together', async () => {
    await SweetModel.create([
      { name: 'Chocolate Cake', category: 'Cake', price: 300, quantity: 10 },
      { name: 'Chocolate Muffin', category: 'Muffin', price: 150, quantity: 15 },
      { name: 'Vanilla Cake', category: 'Cake', price: 250, quantity: 5 },
    ]);

    const response = await request(app)
      .get('/search?name=Chocolate&category=Cake&minPrice=200&maxPrice=400')
      .expect(200);

    expect(response.body.length).toBe(1);
    expect(response.body[0].name).toBe('Chocolate Cake');
  });

  // Edge case: invalid price parameters
  it('should handle invalid price parameters gracefully', async () => {
    await SweetModel.create([
      { name: 'Test Sweet', category: 'Test', price: 100, quantity: 10 },
    ]);

    const response = await request(app)
      .get('/search?minPrice=invalid&maxPrice=notanumber')
      .expect(200);

    // Should return all sweets since invalid prices are ignored
    expect(response.body.length).toBe(1);
  });

  // Edge case: empty search parameters
  it('should return all sweets when no search parameters provided', async () => {
    await SweetModel.create([
      { name: 'Sweet 1', category: 'Category 1', price: 10, quantity: 5 },
      { name: 'Sweet 2', category: 'Category 2', price: 20, quantity: 10 },
    ]);

    const response = await request(app).get('/search').expect(200);

    expect(response.body.length).toBe(2);
  });

  // Edge case: exact price match
  it('should find sweets with exact price match', async () => {
    await SweetModel.create([
      { name: 'Sweet 1', category: 'Test', price: 100, quantity: 5 },
      { name: 'Sweet 2', category: 'Test', price: 200, quantity: 10 },
    ]);

    const response = await request(app)
      .get('/search?minPrice=100&maxPrice=100')
      .expect(200);

    expect(response.body.length).toBe(1);
    expect(response.body[0].name).toBe('Sweet 1');
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

  // Edge case: negative purchase quantity
  it('should return 400 for negative purchase quantity', async () => {
    const sweet = await SweetModel.create({ name: 'Test Sweet', category: 'Test', price: 10, quantity: 10 });
    const sweetId = sweet._id.toString();

    const response = await request(app)
      .post(`/purchase/${sweetId}`)
      .send({ quantity: -5 })
      .expect(400);

    expect(response.body.message).toBe('A positive purchase quantity is required');
  });

  // Edge case: purchase exact available quantity
  it('should purchase exact available quantity successfully', async () => {
    const sweet = await SweetModel.create({
      name: 'Limited Sweet',
      category: 'Test',
      price: 50,
      quantity: 5,
    });
    const sweetId = sweet._id.toString();

    const response = await request(app)
      .post(`/purchase/${sweetId}`)
      .send({ quantity: 5 })
      .expect(200);

    expect(response.body.message).toBe('Purchase successful');

    const updatedSweet = await SweetModel.findById(sweetId);
    expect(updatedSweet?.quantity).toBe(0);
  });

  // Edge case: purchase from sweet with zero stock
  it('should return 400 when trying to purchase from zero stock', async () => {
    const sweet = await SweetModel.create({
      name: 'Out of Stock Sweet',
      category: 'Test',
      price: 30,
      quantity: 0,
    });
    const sweetId = sweet._id.toString();

    const response = await request(app)
      .post(`/purchase/${sweetId}`)
      .send({ quantity: 1 })
      .expect(400);

    expect(response.body.message).toBe('Insufficient stock');
  });

  // Edge case: invalid sweet ID format
  it('should return 500 for invalid sweet ID format', async () => {
    const response = await request(app)
      .post('/purchase/invalid-id')
      .send({ quantity: 1 });

    expect(response.statusCode).toBe(500);
    expect(response.body.message).toBe('Error processing purchase');
  });

  // Edge case: non-existent sweet ID
  it('should return 404 for non-existent sweet ID', async () => {
    const nonExistentId = '507f1f77bcf86cd799439011'; // Valid ObjectId format

    const response = await request(app)
      .post(`/purchase/${nonExistentId}`)
      .send({ quantity: 1 })
      .expect(404);

    expect(response.body.message).toBe('Sweet not found');
  });

  // Edge case: decimal purchase quantity
  it('should handle decimal purchase quantities', async () => {
    const sweet = await SweetModel.create({
      name: 'Decimal Sweet',
      category: 'Test',
      price: 20,
      quantity: 10,
    });
    const sweetId = sweet._id.toString();

    const response = await request(app)
      .post(`/purchase/${sweetId}`)
      .send({ quantity: 2.5 })
      .expect(200);

    expect(response.body.message).toBe('Purchase successful');

    const updatedSweet = await SweetModel.findById(sweetId);
    expect(updatedSweet?.quantity).toBe(7.5);
  });

  // Edge case: very large purchase quantity
  it('should handle very large purchase attempts gracefully', async () => {
    const sweet = await SweetModel.create({
      name: 'Small Stock Sweet',
      category: 'Test',
      price: 10,
      quantity: 5,
    });
    const sweetId = sweet._id.toString();

    const response = await request(app)
      .post(`/purchase/${sweetId}`)
      .send({ quantity: 1000000 })
      .expect(400);

    expect(response.body.message).toBe('Insufficient stock');

    // Verify quantity unchanged
    const unchangedSweet = await SweetModel.findById(sweetId);
    expect(unchangedSweet?.quantity).toBe(5);
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

  // Edge case: zero restock quantity
  it('should return 400 for zero restock quantity', async () => {
    const sweet = await SweetModel.create({ name: 'Test', category: 'Test', price: 1, quantity: 1 });
    const sweetId = sweet._id.toString();

    const response = await request(app)
      .post(`/restock/${sweetId}`)
      .send({ quantity: 0 })
      .expect(400);

    expect(response.body.message).toBe('A positive restock quantity is required');
  });

  // Edge case: invalid sweet ID format
  it('should return 500 for invalid sweet ID format', async () => {
    const response = await request(app)
      .post('/restock/invalid-id')
      .send({ quantity: 10 });

    expect(response.statusCode).toBe(500);
    expect(response.body.message).toBe('Error processing restock');
  });

  // Edge case: non-existent sweet ID
  it('should return 404 for non-existent sweet ID', async () => {
    const nonExistentId = '507f1f77bcf86cd799439011'; // Valid ObjectId format

    const response = await request(app)
      .post(`/restock/${nonExistentId}`)
      .send({ quantity: 10 })
      .expect(404);

    expect(response.body.message).toBe('Sweet not found');
  });

  // Edge case: very large restock quantity
  it('should handle very large restock quantities', async () => {
    const sweet = await SweetModel.create({
      name: 'Large Restock Sweet',
      category: 'Test',
      price: 10,
      quantity: 5,
    });
    const sweetId = sweet._id.toString();

    const response = await request(app)
      .post(`/restock/${sweetId}`)
      .send({ quantity: 1000000 })
      .expect(200);

    expect(response.body.message).toBe('Restock successful');

    const updatedSweet = await SweetModel.findById(sweetId);
    expect(updatedSweet?.quantity).toBe(1000005);
  });

  // Edge case: decimal restock quantity
  it('should handle decimal restock quantities', async () => {
    const sweet = await SweetModel.create({
      name: 'Decimal Restock Sweet',
      category: 'Test',
      price: 15,
      quantity: 10,
    });
    const sweetId = sweet._id.toString();

    const response = await request(app)
      .post(`/restock/${sweetId}`)
      .send({ quantity: 5.5 })
      .expect(200);

    expect(response.body.message).toBe('Restock successful');

    const updatedSweet = await SweetModel.findById(sweetId);
    expect(updatedSweet?.quantity).toBe(15.5);
  });

  // Edge case: restock sweet with zero quantity
  it('should restock sweet that has zero quantity', async () => {
    const sweet = await SweetModel.create({
      name: 'Empty Stock Sweet',
      category: 'Test',
      price: 25,
      quantity: 0,
    });
    const sweetId = sweet._id.toString();

    const response = await request(app)
      .post(`/restock/${sweetId}`)
      .send({ quantity: 20 })
      .expect(200);

    expect(response.body.message).toBe('Restock successful');

    const updatedSweet = await SweetModel.findById(sweetId);
    expect(updatedSweet?.quantity).toBe(20);
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

  // Edge case: empty database
  it('should return empty array when no sweets exist', async () => {
    const response = await request(app).get('/categories').expect(200);

    expect(response.body).toBeInstanceOf(Array);
    expect(response.body.length).toBe(0);
  });

  // Edge case: single category
  it('should return single category when only one category exists', async () => {
    await SweetModel.create([
      { name: 'Sweet 1', category: 'OnlyCategory', price: 10, quantity: 5 },
      { name: 'Sweet 2', category: 'OnlyCategory', price: 20, quantity: 10 },
    ]);

    const response = await request(app).get('/categories').expect(200);

    expect(response.body).toBeInstanceOf(Array);
    expect(response.body.length).toBe(1);
    expect(response.body[0]).toBe('OnlyCategory');
  });

  // Edge case: many different categories
  it('should handle many different categories', async () => {
    const categories = ['Cat1', 'Cat2', 'Cat3', 'Cat4', 'Cat5'];
    const sweets = categories.map((cat, index) => ({
      name: `Sweet ${index}`,
      category: cat,
      price: 10 + index,
      quantity: 5
    }));

    await SweetModel.create(sweets);

    const response = await request(app).get('/categories').expect(200);

    expect(response.body).toBeInstanceOf(Array);
    expect(response.body.length).toBe(5);
    expect(response.body.sort()).toEqual(categories.sort());
  });
});

// Edge case tests for the root route
describe('GET /', () => {
  it('should return welcome message', async () => {
    const response = await request(app).get('/').expect(200);
    expect(response.text).toBe('Welcome to the Sweet Shop API');
  });
});

// Edge case tests for malformed requests
describe('Malformed requests', () => {
  it('should handle requests with invalid JSON', async () => {
    const response = await request(app)
      .post('/add')
      .set('Content-Type', 'application/json')
      .send('{"invalid": json}'); // Malformed JSON

    expect(response.statusCode).toBe(400);
  });

  it('should handle requests with no content-type for POST', async () => {
    const response = await request(app)
      .post('/add')
      .send('some plain text');

    // This should return 400 due to JSON parsing error or 500 due to invalid data
    expect([400, 500]).toContain(response.statusCode);
  });

  // Test for non-existent routes
  it('should return 404 for non-existent routes', async () => {
    const response = await request(app).get('/non-existent-route');
    expect(response.statusCode).toBe(404);
  });

  it('should return 404 for invalid HTTP methods on existing routes', async () => {
    const response = await request(app).patch('/add'); // PATCH not supported
    expect(response.statusCode).toBe(404);
  });
});
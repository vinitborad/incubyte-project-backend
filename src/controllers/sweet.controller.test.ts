import { Request, Response } from 'express';
import {
  addSweetController,
  deleteSweetController,
  getCategoriesController,
  purchaseSweetController,
  restockSweetController,
  searchSweetsController,
  viewSweetsController
} from './sweet.controller';
import { SweetModel } from '../models/sweet.model';

// Mock the entire SweetModel module
jest.mock('../models/sweet.model');

// A helper to create mock request and response objects
const getMockRes = () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    send: jest.fn(),
  } as unknown as Response;
  return res;
};


describe('addSweetController', () => {
  // Clear mock history before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a sweet and return 201 if data is valid', async () => {
    const req = {
      body: { name: 'New Sweet', category: 'Test', price: 10, quantity: 20 },
    } as Request;
    const res = getMockRes();

    // Mock findOne to return null (no duplicate found)
    (SweetModel.findOne as jest.Mock).mockResolvedValue(null);

    await addSweetController(req, res);

    expect(SweetModel.create).toHaveBeenCalledWith(req.body);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('should return 400 if required fields are missing', async () => {
    const req = { body: { name: 'Incomplete Sweet' } } as Request; // Missing fields
    const res = getMockRes();

    await addSweetController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({ message: 'Missing required fields' });
  });

  it('should return 400 if price or quantity are invalid', async () => {
    const req = {
      body: { name: 'Invalid Sweet', category: 'Test', price: -10, quantity: 20 },
    } as Request;
    const res = getMockRes();

    await addSweetController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({ message: 'Price and quantity must be positive numbers' });
  });

  it('should return 400 if a sweet with the same name already exists', async () => {
    const req = {
      body: { name: 'Duplicate Sweet', category: 'Test', price: 10, quantity: 20 },
    } as Request;
    const res = getMockRes();

    // Mock findOne to return an existing sweet
    (SweetModel.findOne as jest.Mock).mockResolvedValue(req.body);

    await addSweetController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({ message: 'A sweet with this name already exists' });
  });

  // Edge case: empty string name
  it('should return 400 if name is empty string', async () => {
    const req = {
      body: { name: '', category: 'Test', price: 10, quantity: 20 },
    } as Request;
    const res = getMockRes();

    await addSweetController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({ message: 'Missing required fields' });
  });

  // Edge case: empty string category
  it('should return 400 if category is empty string', async () => {
    const req = {
      body: { name: 'Test Sweet', category: '', price: 10, quantity: 20 },
    } as Request;
    const res = getMockRes();

    await addSweetController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({ message: 'Missing required fields' });
  });

  // Edge case: zero price
  it('should return 400 if price is zero', async () => {
    const req = {
      body: { name: 'Zero Price Sweet', category: 'Test', price: 0, quantity: 20 },
    } as Request;
    const res = getMockRes();

    await addSweetController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({ message: 'Price and quantity must be positive numbers' });
  });

  // Edge case: negative quantity
  it('should return 400 if quantity is negative', async () => {
    const req = {
      body: { name: 'Negative Quantity Sweet', category: 'Test', price: 10, quantity: -5 },
    } as Request;
    const res = getMockRes();

    await addSweetController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({ message: 'Price and quantity must be positive numbers' });
  });

  // Edge case: zero quantity should be allowed
  it('should allow zero quantity', async () => {
    const req = {
      body: { name: 'Zero Stock Sweet', category: 'Test', price: 10, quantity: 0 },
    } as Request;
    const res = getMockRes();

    (SweetModel.findOne as jest.Mock).mockResolvedValue(null);

    await addSweetController(req, res);

    expect(SweetModel.create).toHaveBeenCalledWith(req.body);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  // Edge case: database error on create
  it('should return 500 if database create fails', async () => {
    const req = {
      body: { name: 'Test Sweet', category: 'Test', price: 10, quantity: 20 },
    } as Request;
    const res = getMockRes();

    (SweetModel.findOne as jest.Mock).mockResolvedValue(null);
    (SweetModel.create as jest.Mock).mockRejectedValue(new Error('Database error'));

    await addSweetController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({ message: 'Error creating sweet' });
  });

  // Edge case: database error on findOne
  it('should return 500 if database findOne fails', async () => {
    const req = {
      body: { name: 'Test Sweet', category: 'Test', price: 10, quantity: 20 },
    } as Request;
    const res = getMockRes();

    (SweetModel.findOne as jest.Mock).mockRejectedValue(new Error('Database error'));

    await addSweetController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({ message: 'Error creating sweet' });
  });
});


describe('viewSweetsController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 200 and an array of sweets if they exist', async () => {
    // Arrange
    const mockSweets = [
      { name: 'Kaju Katli', category: 'Nut-Based', price: 50, quantity: 20 },
      { name: 'Gajar Halwa', category: 'Vegetable-Based', price: 30, quantity: 15 },
    ];
    (SweetModel.find as jest.Mock).mockResolvedValue(mockSweets);

    const req = {} as Request;
    const res = getMockRes(); // Assuming getMockRes helper is in the file

    // Act
    await viewSweetsController(req, res);

    // Assert
    expect(SweetModel.find).toHaveBeenCalledWith({});
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(mockSweets);
  });

  it('should return 200 and an empty array if no sweets exist', async () => {
    // Arrange
    (SweetModel.find as jest.Mock).mockResolvedValue([]); // Mock an empty array

    const req = {} as Request;
    const res = getMockRes();

    // Act
    await viewSweetsController(req, res);

    // Assert
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith([]);
  });

  it('should return 500 if there is a database error', async () => {
    // Arrange
    const dbError = new Error('Database connection failed');
    (SweetModel.find as jest.Mock).mockRejectedValue(dbError); // Mock a failure

    const req = {} as Request;
    const res = getMockRes();

    // Act
    await viewSweetsController(req, res);

    // Assert
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({ message: 'Error fetching sweets' });
  });
});


describe('deleteSweetController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should delete a sweet and return 200 if the sweet exists', async () => {
    // Arrange
    const sweetId = 'some-valid-id';
    const req = { params: { id: sweetId } } as unknown as Request;
    const res = getMockRes();

    // Mock findByIdAndDelete to return a deleted document (simulating success)
    (SweetModel.findByIdAndDelete as jest.Mock).mockResolvedValue({ _id: sweetId });

    // Act
    await deleteSweetController(req, res);

    // Assert
    expect(SweetModel.findByIdAndDelete).toHaveBeenCalledWith(sweetId);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({ message: 'Sweet deleted successfully' });
  });

  it('should return 404 if the sweet to delete does not exist', async () => {
    // Arrange
    const sweetId = 'non-existent-id';
    const req = { params: { id: sweetId } } as unknown as Request;
    const res = getMockRes();

    // Mock findByIdAndDelete to return null (simulating not found)
    (SweetModel.findByIdAndDelete as jest.Mock).mockResolvedValue(null);

    // Act
    await deleteSweetController(req, res);

    // Assert
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith({ message: 'Sweet not found' });
  });

  it('should return 500 if there is a database error', async () => {
    // Arrange
    const sweetId = 'some-id';
    const req = { params: { id: sweetId } } as unknown as Request;
    const res = getMockRes();

    // Mock findByIdAndDelete to throw an error
    const dbError = new Error('DB Error');
    (SweetModel.findByIdAndDelete as jest.Mock).mockRejectedValue(dbError);

    // Act
    await deleteSweetController(req, res);

    // Assert
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({ message: 'Error deleting sweet' });
  });
});


describe('searchSweetsController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call SweetModel.find with an empty filter if no query params are provided', async () => {
    // Arrange
    const req = { query: {} } as unknown as Request;
    const res = getMockRes();
    (SweetModel.find as jest.Mock).mockReturnValue({
      sort: jest.fn().mockResolvedValue([]),
    });

    // Act
    await searchSweetsController(req, res);

    // Assert
    expect(SweetModel.find).toHaveBeenCalledWith({});
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should build a filter for name, category, and price range correctly', async () => {
    // Arrange
    const req = {
      query: {
        name: 'Cake',
        category: 'Pastry',
        minPrice: '100',
        maxPrice: '500',
      },
    } as unknown as Request;
    const res = getMockRes();
    (SweetModel.find as jest.Mock).mockReturnValue({
      sort: jest.fn().mockResolvedValue([]),
    });

    // Act
    await searchSweetsController(req, res);

    // Assert: Check that the filter object was constructed correctly
    const expectedFilter = {
      name: { $regex: 'Cake', $options: 'i' },
      category: 'Pastry',
      price: { $gte: 100, $lte: 500 },
    };
    expect(SweetModel.find).toHaveBeenCalledWith(expectedFilter);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should only build a filter for minPrice if maxPrice is not provided', async () => {
    // Arrange
    const req = { query: { minPrice: '50' } } as unknown as Request;
    const res = getMockRes();
    (SweetModel.find as jest.Mock).mockReturnValue({
      sort: jest.fn().mockResolvedValue([]),
    });

    // Act
    await searchSweetsController(req, res);

    // Assert
    expect(SweetModel.find).toHaveBeenCalledWith({ price: { $gte: 50 } });
  });

  // Edge case: only maxPrice provided
  it('should only build a filter for maxPrice if minPrice is not provided', async () => {
    const req = { query: { maxPrice: '100' } } as unknown as Request;
    const res = getMockRes();
    (SweetModel.find as jest.Mock).mockReturnValue({
      sort: jest.fn().mockResolvedValue([]),
    });

    await searchSweetsController(req, res);

    expect(SweetModel.find).toHaveBeenCalledWith({ price: { $lte: 100 } });
  });

  // Edge case: database error
  it('should return 500 if database operation fails', async () => {
    const req = { query: {} } as unknown as Request;
    const res = getMockRes();
    (SweetModel.find as jest.Mock).mockReturnValue({
      sort: jest.fn().mockRejectedValue(new Error('Database error')),
    });

    await searchSweetsController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({ message: 'Error searching sweets' });
  });

  // Edge case: invalid price values
  it('should handle invalid price values by ignoring them', async () => {
    const req = {
      query: { minPrice: 'invalid', maxPrice: 'alsoInvalid' },
    } as unknown as Request;
    const res = getMockRes();
    (SweetModel.find as jest.Mock).mockReturnValue({
      sort: jest.fn().mockResolvedValue([]),
    });

    await searchSweetsController(req, res);

    // Invalid prices should be ignored, so filter should be empty
    expect(SweetModel.find).toHaveBeenCalledWith({});
  });

  // Edge case: empty string values
  it('should handle empty string values properly', async () => {
    const req = {
      query: { name: '', category: '', minPrice: '', maxPrice: '' },
    } as unknown as Request;
    const res = getMockRes();
    (SweetModel.find as jest.Mock).mockReturnValue({
      sort: jest.fn().mockResolvedValue([]),
    });

    await searchSweetsController(req, res);

    // Empty strings are falsy, so they shouldn't be included in filter
    expect(SweetModel.find).toHaveBeenCalledWith({});
  });
});


describe('purchaseSweetController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should decrease quantity and return 200 on a valid purchase', async () => {
    // Arrange
    const mockSweet = {
      _id: 'some-id',
      quantity: 50,
      save: jest.fn().mockResolvedValue(true), // Mock the save method
    };
    (SweetModel.findById as jest.Mock).mockResolvedValue(mockSweet);

    const req = {
      params: { id: 'some-id' },
      body: { quantity: 10 },
    } as unknown as Request;
    const res = getMockRes();

    // Act
    await purchaseSweetController(req, res);

    // Assert
    expect(SweetModel.findById).toHaveBeenCalledWith('some-id');
    expect(mockSweet.save).toHaveBeenCalled();
    expect(mockSweet.quantity).toBe(40); // 50 - 10
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should return 400 if purchase quantity is missing or zero', async () => {
    // Arrange
    const req = {
      params: { id: 'some-id' },
      body: { quantity: 0 }, // Invalid quantity
    } as unknown as Request;
    const res = getMockRes();

    // Act
    await purchaseSweetController(req, res);

    // Assert
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({ message: 'A positive purchase quantity is required' });
  });

  it('should return 400 if stock is insufficient', async () => {
    // Arrange
    const mockSweet = { quantity: 5, save: jest.fn() };
    (SweetModel.findById as jest.Mock).mockResolvedValue(mockSweet);

    const req = {
      params: { id: 'some-id' },
      body: { quantity: 10 }, // Trying to buy more than in stock
    } as unknown as Request;
    const res = getMockRes();

    // Act
    await purchaseSweetController(req, res);

    // Assert
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({ message: 'Insufficient stock' });
  });

  it('should return 404 if sweet is not found', async () => {
    // Arrange
    (SweetModel.findById as jest.Mock).mockResolvedValue(null);
    const req = {
      params: { id: 'not-found-id' },
      body: { quantity: 1 },
    } as unknown as Request;
    const res = getMockRes();

    // Act
    await purchaseSweetController(req, res);

    // Assert
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith({ message: 'Sweet not found' });
  });

  // Edge case: negative quantity
  it('should return 400 for negative purchase quantity', async () => {
    const req = {
      params: { id: 'some-id' },
      body: { quantity: -5 },
    } as unknown as Request;
    const res = getMockRes();

    await purchaseSweetController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({ message: 'A positive purchase quantity is required' });
  });

  // Edge case: undefined quantity
  it('should return 400 for undefined quantity', async () => {
    const req = {
      params: { id: 'some-id' },
      body: {},
    } as unknown as Request;
    const res = getMockRes();

    await purchaseSweetController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({ message: 'A positive purchase quantity is required' });
  });

  // Edge case: database error on findById
  it('should return 500 if database findById fails', async () => {
    (SweetModel.findById as jest.Mock).mockRejectedValue(new Error('Database error'));
    const req = {
      params: { id: 'some-id' },
      body: { quantity: 5 },
    } as unknown as Request;
    const res = getMockRes();

    await purchaseSweetController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({ message: 'Error processing purchase' });
  });

  // Edge case: database error on save
  it('should return 500 if database save fails', async () => {
    const mockSweet = {
      quantity: 50,
      save: jest.fn().mockRejectedValue(new Error('Save failed')),
    };
    (SweetModel.findById as jest.Mock).mockResolvedValue(mockSweet);

    const req = {
      params: { id: 'some-id' },
      body: { quantity: 10 },
    } as unknown as Request;
    const res = getMockRes();

    await purchaseSweetController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({ message: 'Error processing purchase' });
  });
});


describe('restockSweetController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should increase quantity and return 200 on a valid restock', async () => {
    // Arrange
    const req = {
      params: { id: 'some-id' },
      body: { quantity: 50 },
    } as unknown as Request;
    const res = getMockRes();
    (SweetModel.findByIdAndUpdate as jest.Mock).mockResolvedValue({ _id: 'some-id', quantity: 100 });

    // Act
    await restockSweetController(req, res);

    // Assert
    expect(SweetModel.findByIdAndUpdate).toHaveBeenCalledWith(
      'some-id',
      { $inc: { quantity: 50 } },
      { new: true }
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should return 400 if restock quantity is missing or not positive', async () => {
    // Arrange
    const req = {
      params: { id: 'some-id' },
      body: { quantity: -10 }, // Invalid quantity
    } as unknown as Request;
    const res = getMockRes();

    // Act
    await restockSweetController(req, res);

    // Assert
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({ message: 'A positive restock quantity is required' });
  });

  it('should return 404 if sweet to restock is not found', async () => {
    // Arrange
    (SweetModel.findByIdAndUpdate as jest.Mock).mockResolvedValue(null);
    const req = {
      params: { id: 'not-found-id' },
      body: { quantity: 10 },
    } as unknown as Request;
    const res = getMockRes();

    // Act
    await restockSweetController(req, res);

    // Assert
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith({ message: 'Sweet not found' });
  });

  // Edge case: zero quantity
  it('should return 400 for zero restock quantity', async () => {
    const req = {
      params: { id: 'some-id' },
      body: { quantity: 0 },
    } as unknown as Request;
    const res = getMockRes();

    await restockSweetController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({ message: 'A positive restock quantity is required' });
  });

  // Edge case: undefined quantity
  it('should return 400 for undefined quantity', async () => {
    const req = {
      params: { id: 'some-id' },
      body: {},
    } as unknown as Request;
    const res = getMockRes();

    await restockSweetController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({ message: 'A positive restock quantity is required' });
  });

  // Edge case: database error
  it('should return 500 if database operation fails', async () => {
    (SweetModel.findByIdAndUpdate as jest.Mock).mockRejectedValue(new Error('Database error'));
    const req = {
      params: { id: 'some-id' },
      body: { quantity: 10 },
    } as unknown as Request;
    const res = getMockRes();

    await restockSweetController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({ message: 'Error processing restock' });
  });
});


describe('getCategoriesController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call SweetModel.distinct and return a list of categories', async () => {
    // Arrange
    const mockCategories = ['Cake', 'Muffin', 'Pastry'];
    (SweetModel.distinct as jest.Mock).mockResolvedValue(mockCategories);

    const req = {} as Request;
    const res = getMockRes();

    // Act
    await getCategoriesController(req, res);

    // Assert
    expect(SweetModel.distinct).toHaveBeenCalledWith('category');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(mockCategories);
  });

  // Edge case: empty categories
  it('should return empty array when no categories exist', async () => {
    (SweetModel.distinct as jest.Mock).mockResolvedValue([]);

    const req = {} as Request;
    const res = getMockRes();

    await getCategoriesController(req, res);

    expect(SweetModel.distinct).toHaveBeenCalledWith('category');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith([]);
  });

  // Edge case: database error
  it('should return 500 if database operation fails', async () => {
    (SweetModel.distinct as jest.Mock).mockRejectedValue(new Error('Database error'));

    const req = {} as Request;
    const res = getMockRes();

    await getCategoriesController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({ message: 'Error fetching categories' });
  });
});
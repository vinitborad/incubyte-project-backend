import { Request, Response } from 'express';
import {
  addSweetController,
  deleteSweetController,
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
});
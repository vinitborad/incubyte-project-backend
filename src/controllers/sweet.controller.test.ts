import { Request, Response } from 'express';
import { addSweetController, viewSweetsController } from './sweet.controller';
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

// --- Tests for addSweetController ---
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
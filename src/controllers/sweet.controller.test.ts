import { Request, Response } from 'express';
import { addSweetController } from './sweet.controller';
import { SweetModel } from '../models/sweet.model'; // This will fail

// Mock the SweetModel
jest.mock('../models/sweet.model');

describe('addSweetController', () => {
  it('should call SweetModel.create with the correct data', async () => {
    const req = {
      body: {
        name: 'Rasgulla',
        category: 'Milk-Based',
        price: 15,
        quantity: 100,
      },
    } as Request;

    // Mock the response object with jest.fn() to spy on it
    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    } as unknown as Response;

    // Call the controller
    addSweetController(req, res);

    // Assert that the create method was called with the correct payload
    expect(SweetModel.create).toHaveBeenCalledWith(req.body);
  });
});
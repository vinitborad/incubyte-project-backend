import { Request, Response } from 'express';
import { SweetModel } from '../models/sweet.model';

export const addSweetController = async (req: Request, res: Response) => {
  try {
    const { name, category, price, quantity } = req.body;

    if (!name || !category || price === undefined || quantity === undefined) {
      return res.status(400).send({ message: 'Missing required fields' });
    }

    if (price <= 0 || quantity < 0) {
      return res.status(400).send({ message: 'Price and quantity must be positive numbers' });
    }

    const existingSweet = await SweetModel.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (existingSweet) {
      return res.status(400).send({ message: 'A sweet with this name already exists' });
    }

    const newSweet = await SweetModel.create({ name, category, price, quantity });
    res.status(201).send(newSweet);
  } catch (error) {
    res.status(500).send({ message: 'Error creating sweet' });
  }
};


export const viewSweetsController = async (req: Request, res: Response) => {
  try {
    const sweets = await SweetModel.find({});
    res.status(200).send(sweets);
  } catch (error) {
    res.status(500).send({ message: 'Error fetching sweets' });
  }
};


export const deleteSweetController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deletedSweet = await SweetModel.findByIdAndDelete(id);

    if (!deletedSweet) {
      return res.status(404).send({ message: 'Sweet not found' });
    }

    res.status(200).send({ message: 'Sweet deleted successfully' });
  } catch (error) {
    res.status(500).send({ message: 'Error deleting sweet' });
  }
};


export const searchSweetsController = async (req: Request, res: Response) => {
  try {
    const { name, category, minPrice, maxPrice } = req.query;
    const filter: { [key: string]: any } = {};

    if (name) {
      filter.name = { $regex: name as string, $options: 'i' };
    }

    if (category) {
      filter.category = category;
    }

    // Add logic for price range
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) {
        filter.price.$gte = Number(minPrice); // $gte for "greater than or equal to"
      }
      if (maxPrice) {
        filter.price.$lte = Number(maxPrice); // $lte for "less than or equal to"
      }
    }

    const sweets = await SweetModel.find(filter).sort({ price: 1 });
    res.status(200).send(sweets);
  } catch (error) {
    res.status(500).send({ message: 'Error searching sweets' });
  }
};


export const purchaseSweetController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { quantity: purchaseQuantity } = req.body;

    // 1. New Validation: Check if quantity is provided and is a positive number
    if (!purchaseQuantity || purchaseQuantity <= 0) {
      return res.status(400).send({ message: 'A positive purchase quantity is required' });
    }

    const sweet = await SweetModel.findById(id);

    if (!sweet) {
      return res.status(404).send({ message: 'Sweet not found' });
    }

    if (sweet.quantity < purchaseQuantity) {
      return res.status(400).send({ message: 'Insufficient stock' });
    }

    sweet.quantity -= purchaseQuantity;
    await sweet.save();

    res.status(200).send({ message: 'Purchase successful', sweet });
  } catch (error) {
    res.status(500).send({ message: 'Error processing purchase' });
  }
};


export const restockSweetController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { quantity: restockQuantity } = req.body;

    // New Validation: Check if quantity is provided and is a positive number
    if (!restockQuantity || restockQuantity <= 0) {
      return res.status(400).send({ message: 'A positive restock quantity is required' });
    }

    const updatedSweet = await SweetModel.findByIdAndUpdate(
      id,
      { $inc: { quantity: restockQuantity } },
      { new: true }
    );

    if (!updatedSweet) {
      return res.status(404).send({ message: 'Sweet not found' });
    }

    res.status(200).send({ message: 'Restock successful', sweet: updatedSweet });
  } catch (error) {
    res.status(500).send({ message: 'Error processing restock' });
  }
};
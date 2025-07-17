import { Request, Response } from 'express';
import { SweetModel } from '../models/sweet.model';

export const addSweetController = async (req: Request, res: Response) => {
  try {
    const { name, category, price, quantity } = req.body;

    // Enhanced validation for empty strings and data types
    if (!name || !category || price === undefined || quantity === undefined ||
      name.trim() === '' || category.trim() === '') {
      return res.status(400).send({ message: 'Missing required fields' });
    }

    // Check if price and quantity are numbers
    if (typeof price !== 'number' || typeof quantity !== 'number' || isNaN(price) || isNaN(quantity)) {
      return res.status(400).send({ message: 'Price and quantity must be valid numbers' });
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

    // Add logic for price range with better error handling
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) {
        const minPriceNum = Number(minPrice);
        if (!isNaN(minPriceNum)) {
          filter.price.$gte = minPriceNum; // $gte for "greater than or equal to"
        }
      }
      if (maxPrice) {
        const maxPriceNum = Number(maxPrice);
        if (!isNaN(maxPriceNum)) {
          filter.price.$lte = maxPriceNum; // $lte for "less than or equal to"
        }
      }
      // If no valid price filters were added, remove the price filter
      if (Object.keys(filter.price).length === 0) {
        delete filter.price;
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

export const getCategoriesController = async (req: Request, res: Response) => {
  try {
    // Use .distinct() to get an array of unique values for the 'category' field
    const categories = await SweetModel.distinct('category');
    res.status(200).send(categories);
  } catch (error) {
    res.status(500).send({ message: 'Error fetching categories' });
  }
};
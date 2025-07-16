import { Request, Response } from 'express';
import { SweetModel } from '../models/sweet.model';

export const addSweetController = async (req: Request, res: Response) => {
  try {
    // Use the model to create a sweet with the request body
    const newSweet = await SweetModel.create(req.body);
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
import { Request, Response } from 'express';

export const addSweetController = (req: Request, res: Response) => {
  const { name, category, price, quantity } = req.body;

  // The logic is still fake for now
  const newSweet = {
    id: 'some-random-id',
    name,
    category,
    price,
    quantity,
  };

  res.status(201).send(newSweet);
};
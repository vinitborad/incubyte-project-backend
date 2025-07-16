import { Router } from 'express';
import {
  addSweetController,
  viewSweetsController,
  deleteSweetController,
  searchSweetsController,
  purchaseSweetController,
  restockSweetController,
  getCategoriesController,
} from '../controllers/sweet.controller';

const router = Router();

router.post('/add', addSweetController);
router.get('/view-all', viewSweetsController);
router.delete('/delete/:id', deleteSweetController);
router.get('/search', searchSweetsController);
router.post('/purchase/:id', purchaseSweetController);
router.post('/restock/:id', restockSweetController);
router.get('/categories', getCategoriesController);

export default router;
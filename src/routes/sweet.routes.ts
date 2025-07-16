import { Router } from 'express';
import {
  addSweetController,
  viewSweetsController,
  deleteSweetController,
  searchSweetsController,
  purchaseSweetController,
  restockSweetController,
} from '../controllers/sweet.controller';

const router = Router();

router.post('/add', addSweetController);
router.get('/view', viewSweetsController);
router.delete('/delete/:id', deleteSweetController);
router.get('/search', searchSweetsController);
router.post('/purchase/:id', purchaseSweetController);
router.post('/restock/:id', restockSweetController);

export default router;
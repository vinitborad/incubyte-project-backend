import { Router } from 'express';
import {
  addSweetController,
  viewSweetsController,
  deleteSweetController,
  searchSweetsController,
} from '../controllers/sweet.controller';

const router = Router();

router.post('/add', addSweetController);
router.get('/view', viewSweetsController);
router.delete('/delete/:id', deleteSweetController);
router.get('/search', searchSweetsController);

export default router;
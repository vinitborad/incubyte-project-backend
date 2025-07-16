import { Router } from 'express';
import {
  addSweetController,
  viewSweetsController,
  deleteSweetController,
} from '../controllers/sweet.controller';

const router = Router();

router.post('/add', addSweetController);
router.get('/view', viewSweetsController);
router.delete('/delete/:id', deleteSweetController);

export default router;
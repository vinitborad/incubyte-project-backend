import { Router } from 'express';
import {
  addSweetController,
  viewSweetsController,
} from '../controllers/sweet.controller';

const router = Router();

router.post('/add', addSweetController);
router.get('/view', viewSweetsController);

export default router;
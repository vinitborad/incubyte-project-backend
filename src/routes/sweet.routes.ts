import { Router } from 'express';
import { addSweetController } from '../controllers/sweet.controller';

const router = Router();

router.post('/add', addSweetController);

export default router;
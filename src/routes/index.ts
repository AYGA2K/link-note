import { Router } from 'express';
import authRouter from './auth';
import noteRouter from './note';

export const router = Router();

router.use('/auth', authRouter);
router.use('/notes', noteRouter);


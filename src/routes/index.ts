import { Router } from 'express';
import authRouter from './auth';
import noteRouter from './note';
import folderRouter from './folder';

export const router = Router();

router.use('/auth', authRouter);
router.use('/notes', noteRouter);
router.use('/folders', folderRouter);


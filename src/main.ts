import express from 'express';
import { connectDB } from './database/db';
import { router } from './routes';
import dotenv from 'dotenv';
import { errorHandler } from './middlewares/errorHandler';
dotenv.config();

const app = express();

app.use(express.json());
app.use('/api', router);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;


connectDB();
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

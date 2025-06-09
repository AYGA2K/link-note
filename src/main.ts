import express from 'express';
import { connectDB } from './database/db';
import { router } from './routes';
import dotenv from 'dotenv';
dotenv.config();

const app = express();

app.use(express.json());
app.use('/api', router);

const PORT = process.env.PORT || 3000;


connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
});


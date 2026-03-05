import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import identifyRouter from './routes/identify';

dotenv.config();

const app = express();
app.use(express.json());
app.get('/', (req, res) => {
  res.json({
    service: 'Bitespeed Identity Reconciliation API',
    status: 'running',
    endpoint: 'POST /identify'
  });
});
app.use('/', identifyRouter);

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI!;

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => console.error('DB connection error:', err));
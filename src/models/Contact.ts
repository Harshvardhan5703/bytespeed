import mongoose, { Document, Schema } from 'mongoose';

export interface IContact extends Document {
  phoneNumber?: string;
  email?: string;
  linkedId?: number;
  linkPrecedence: 'primary' | 'secondary';
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  numericId: number; // auto-increment simulation
}

const ContactSchema = new Schema<IContact>(
  {
    numericId:      { type: Number, unique: true },
    phoneNumber:    { type: String, default: null },
    email:          { type: String, default: null },
    linkedId:       { type: Number, default: null },
    linkPrecedence: { type: String, enum: ['primary', 'secondary'], required: true },
    deletedAt:      { type: Date, default: null },
  },
  { timestamps: true }
);

// Auto-increment numericId using a counter collection
const CounterSchema = new Schema({ _id: String, seq: Number });
const Counter = mongoose.model('Counter', CounterSchema);

ContactSchema.pre('save', async function (next) {
  if (this.isNew) {
    const counter = await Counter.findByIdAndUpdate(
      'contactId',
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    // @ts-ignore
    this.numericId = counter!.seq;
  }
  next();
});

export default mongoose.model<IContact>('Contact', ContactSchema);
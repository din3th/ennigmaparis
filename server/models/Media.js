import mongoose from 'mongoose';

const mediaSchema = new mongoose.Schema(
  {
    filename: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    contentType: {
      type: String,
      required: true,
      default: 'image/jpeg',
    },
    data: {
      type: Buffer,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Media || mongoose.model('Media', mediaSchema);

import mongoose, { type InferSchemaType, type Model } from "mongoose";

const groupSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 40 },
    color: { type: String, required: true },
    isDefault: { type: Boolean, default: false },
    isPublic: { type: Boolean, default: false },
    shareId: { type: String, unique: true, sparse: true },
  },
  { timestamps: true },
);

groupSchema.index(
  { userId: 1, isDefault: 1 },
  { unique: true, partialFilterExpression: { isDefault: true } },
);

export type GroupDoc = InferSchemaType<typeof groupSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Group: Model<GroupDoc> =
  (mongoose.models.Group as Model<GroupDoc>) ||
  mongoose.model<GroupDoc>("Group", groupSchema);

import mongoose, { type InferSchemaType, type Model } from "mongoose";

const bookmarkSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: "Group", required: true },
    url: { type: String, required: true, maxlength: 2048 },
    title: { type: String, required: true, maxlength: 200 },
    description: { type: String, default: "", maxlength: 400 },
    domain: { type: String, required: true },
    // Favicons are stored (small) so the browser never contacts third-party hosts.
    faviconData: { type: Buffer, select: false },
    faviconType: { type: String, select: false },
    faviconVersion: { type: Number, default: 0 },
  },
  { timestamps: true },
);

bookmarkSchema.index({ userId: 1, createdAt: -1 });
bookmarkSchema.index({ groupId: 1 });

export type BookmarkDoc = InferSchemaType<typeof bookmarkSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Bookmark: Model<BookmarkDoc> =
  (mongoose.models.Bookmark as Model<BookmarkDoc>) ||
  mongoose.model<BookmarkDoc>("Bookmark", bookmarkSchema);

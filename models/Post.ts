import mongoose from "mongoose";

const PostSchema = new mongoose.Schema(
  {
    post: {
      post_id: String,
      user_id: String,
      content: String,

      hashtags: [String],

      image_url: String,
      recipe_url: String,

      likes_count: Number,
      comments_count: Number,

      created_at:{ type: Date, default: Date.now },
    },
  },
  {
    collection: "posts",
  }
);

const Post =
  mongoose.models.Post ||
  mongoose.model("Post", PostSchema);

export default Post;
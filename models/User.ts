import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const UserSchema = new mongoose.Schema(
  {
    users: {
      user_id:  String,
      email:    { type: String, required: true, unique: true },

      authProvider:      String, // "local", "google", etc.
      password_hash:     String, // stores bcrypt hash

      display_name:      String,

      role: {
        type:    String,
        enum:    ["user", "admin"],
        default: "user",
      },

      profile_image_url: String,
      bio:               String,

      social_links: {
        instagram: String,
        facebook:  String,
        twitter:   String,
        tiktok:    String,
        youtube:   String,
      },

      created_at: { type: Date, default: Date.now },
    },
  },
  {
    collection: "users",
  }
);

// Auto-hash password before saving
UserSchema.pre("save", async function () {
  const user = this as any;
  if (!user.isModified("users.password_hash")) return;
  user.users.password_hash = await bcrypt.hash(user.users.password_hash, 10);
});
// Helper method to verify password at login
UserSchema.methods.comparePassword = async function (plainPassword: string) {
  return bcrypt.compare(plainPassword, this.users.password_hash);
};

const User = mongoose.models.User || mongoose.model("User", UserSchema);

export default User;
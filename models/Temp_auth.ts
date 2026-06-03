import mongoose from "mongoose";

const TempAuthSchema = new mongoose.Schema(
  {
    email: { 
      type: String, 
      required: true 
    },
    password_hash: { 
      type: String
    }, 
    username: {
      type: String
    },
    otp_code: { 
      type: String, 
      required: true 
    },
    purpose: { 
      type: String, 
      enum: ["register", "login", "forgot_password", "reset_password"], 
      required: true 
    },
    createdAt: { 
      type: Date, 
      default: Date.now, 
      expires: 300
    },
  },
  {
    collection: "temp_auths",
  }
);

const Temp_auth = mongoose.models.Temp_auth || mongoose.model("Temp_auth", TempAuthSchema);
export default Temp_auth;
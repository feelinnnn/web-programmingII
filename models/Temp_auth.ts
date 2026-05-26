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
    otp_code: { 
      type: String, 
      required: true 
    },
    purpose: { 
      type: String, 
      enum: ["register", "login"], 
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

const TempAuth = mongoose.models.TempAuth || mongoose.model("TempAuth", TempAuthSchema);
export default TempAuth;
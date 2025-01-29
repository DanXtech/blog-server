import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config(); 

const connect = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL, {});
    console.log("Connected to Database!");
  } catch (error) {
    console.log("Server error", error.message);
    process.exit(1);
  }
};
export default connect;

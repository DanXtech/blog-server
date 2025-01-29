import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import connect from "./db/connect.js";
import userRoutes from "./routes/userRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import { erroHandle, notFound } from "./middleware/errorMiddleware.js";
import upload from "express-fileupload";
import { fileURLToPath } from "url";
import path from "path";

dotenv.config();
const app = express();

// Use fileURLToPath to get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename); // Fixed the __dirname syntax

app.use(express.json({ extended: true }));
app.use(express.urlencoded({ extended: true }));
app.use(cors({ credentials: true, origin: process.env.FRONTEND_URL }));
app.use(upload());
app.use(cookieParser());

app.use("/uploads", express.static(path.join(__dirname, "/uploads")));
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use(notFound);
app.use(erroHandle);

const PORT = process.env.PORT || 8000; // Added fallback port

connect(process.env.MONGO_URL)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`); // Fixed template literal syntax
    });
  })
  .catch((error) => {
    console.log(error);
  });

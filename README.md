Since getUser controller is only for the Profile Page, we could use req.user to get the current logged-in user instead. Which would be coming from an authMiddleware we`ll be creating later.

import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import connect from "./db/connect.js";
import userRoutes from "./routes/userRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import { erroHandle, notFound } from "./middleware/errorMiddleware.js";
import upload from "express-fileupload";
import { fileURLToPath } from "url"; // Import URL module
import path from "path"; // Import path module

dotenv.config();
const app = express();

// Use fileURLToPath to get the directory name
const **filename = fileURLToPath(import.meta.url);
const **dirname = path.dirname(\_\_filename); // Get the current directory path

app.use(express.json({ extended: true }));
app.use(express.urlencoded({ extended: true }));
app.use(cors({ credentials: true, origin: "http://localhost:5173" }));
app.use(upload());

// Fix the issue by using **dirname correctly
app.use("/uploads", express.static(path.join(**dirname, "/uploads")));

app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);

app.use(notFound);
app.use(erroHandle);

connect(process.env.MONGO_URL)
.then(
app.listen(8000, () =>
console.log(`Server running on port ${process.env.PORT}`)
)
)
.catch((error) => {
console.log(error);
});

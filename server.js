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

// Get directory path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define allowed origins
const allowedOrigins = [
    "http://localhost:5173", // Local development
    process.env.FRONTEND_URL, // Hosted frontend (from .env)
].filter(Boolean); // Removes undefined values

// CORS setup
app.use(
    cors({
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error("Not allowed by CORS"));
            }
        },
        credentials: true, // Allow cookies & authentication headers
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);

// Middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(upload());
app.use(cookieParser());

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "/uploads")));

// Routes
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);

// Error handling
app.use(notFound);
app.use(erroHandle);

// Connect to database and start server
connect(process.env.MONGO_URL)
    .then(() => {
        const PORT = process.env.PORT || 8000;
        app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    })
    .catch((error) => {
        console.error("Database connection error:", error);
    });


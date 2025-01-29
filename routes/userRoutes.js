import { Router } from "express";
import {
  registerUser,
  loginUser,
  getUser,
  changeAvatar,
  editUser,
  getAuthors,
} from "../controllers/userControllers.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = Router();

// Define routes
router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/:id", getUser);
router.get("/", getAuthors);
router.post("/change-avatar", authMiddleware, changeAvatar);
router.patch("/edit-user", authMiddleware, editUser);

export default router;

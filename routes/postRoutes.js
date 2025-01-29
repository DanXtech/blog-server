import { Router } from "express";
import {
  createPost,
  deletePosts,
  editPosts,
  getCatPosts,
  getPost,
  getPosts,
  getUserPosts,
} from "../controllers/postControlers.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/", authMiddleware, createPost);
router.get("/", getPosts);
router.get("/:id", getPost);
router.get("/categories/:category", getCatPosts);
router.get("/users/:id", getUserPosts);
router.patch("/:id", authMiddleware, editPosts);
router.delete("/:id", authMiddleware, deletePosts);
export default router;

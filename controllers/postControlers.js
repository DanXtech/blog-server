import Post from "../models/postModels.js";
import User from "../models/userModel.js";
import HttpError from "../models/errorModels.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { v4 as uuid } from "uuid";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a post
// POST :api/posts
// PROTECTED
export const createPost = async (req, res, next) => {
  try {
    let { title, category, description } = req.body;
    if (!title || !category || !description) {
      return next(
        new HttpError("Fill in all fields and choose a thumbnail.", 422)
      );
    }

    if (!req.files || !req.files.thumbnail) {
      return next(new HttpError("Thumbnail is required.", 400));
    }

    const { thumbnail } = req.files;

    // Check file size (limit to 2MB)
    if (thumbnail.size > 2 * 1024 * 1024) {
      return next(
        new HttpError("Thumbnail too big. File should be less than 2MB.", 400)
      );
    }

    let fileName = thumbnail.name;
    let splittedFilename = fileName.split(".");
    let newFilename =
      splittedFilename[0] +
      uuid() +
      "." +
      splittedFilename[splittedFilename.length - 1];

    // Move the file synchronously using await
    await thumbnail.mv(path.join(__dirname, "..", "/uploads", newFilename));

    // Create the post after the file is successfully moved
    const newPost = await Post.create({
      title,
      category,
      description,
      thumbnail: newFilename,
      creator: req.user.id,
    });

    if (!newPost) {
      return next(new HttpError("Post couldn't be created.", 422));
    }

    // Find user and increase post count safely
    const currentUser = await User.findById(req.user.id);
    if (currentUser) {
      const userPostCount = (currentUser.posts || 0) + 1;
      await User.findByIdAndUpdate(req.user.id, { posts: userPostCount });
    }

    res.status(201).json(newPost);
  } catch (error) {
    return next(new HttpError(error.message || "Something went wrong.", 500));
  }
};

// Get all posts
// post :api/posts
// UNPROTECTED
export const getPosts = async (req, res, next) => {
  try {
    const posts = await Post.find().sort({ updatedAt: -1 });
    res.status(200).json(posts);
  } catch (error) {
    return next(new HttpError(error));
  }
};

// Get single post
// post :api/posts/id
// UNPROTECTED
export const getPost = async (req, res, next) => {
  try {
    const postId = req.params.id;
    const post = await Post.findById(postId);

    if (!post) {
      return next(new HttpError("Post not found", 404));
    }

    res.status(200).json(post);
  } catch (error) {
    return next(new HttpError(error));
  }
};

// get post by category
// GET :api/posts/categories/:category
// PROTECTED
export const getCatPosts = async (req, res, next) => {
  try {
    const { category } = req.params;
    const catPosts = await Post.find({ category }).sort({ createdAt: -1 });
    res.status(200).json(catPosts);
  } catch (error) {
    return next(new HttpError(error));
  }
};

// get author post
// GET :api/posts/users/:id
// UNPROTECTED
export const getUserPosts = async (req, res, next) => {
  try {
    const { id } = req.params; // Use route parameters instead of req.body

    if (!id) {
      return next(new HttpError("User ID is required.", 400));
    }

    const posts = await Post.find({ creator: id }).sort({ createdAt: -1 });

    res.status(200).json(posts);
  } catch (error) {
    return next(
      new HttpError(error.message || "Failed to fetch user posts.", 500)
    );
  }
};

// edit post
// patch :api/posts/users/:id
// PROTECTED
export const editPosts = async (req, res, next) => {
  try {
    const postId = req.params.id;
    let { title, category, description } = req.body;

    // 🛑 Ensure all required fields are provided and description is long enough
    if (!title || !category || description.length < 12) {
      return next(new HttpError("Fill in all fields.", 422));
    }

    // 🔍 Find the existing post in the database
    const existingPost = await Post.findById(postId);
    if (!existingPost) {
      return next(new HttpError("Post not found.", 404));
    }

    // 🔒 Ensure the logged-in user is the owner of the post
    if (req.user.id !== existingPost.creator.toString()) {
      return next(new HttpError("Unauthorized to edit this post.", 403));
    }

    let updatedPost;

    // 📷 If no new thumbnail is uploaded, update only text fields
    if (!req.files || !req.files.thumbnail) {
      updatedPost = await Post.findByIdAndUpdate(
        postId,
        { title, category, description },
        { new: true }
      );
    } else {
      // 🗑️ Delete the old thumbnail if it exists
      try {
        if (existingPost.thumbnail) {
          await fs.promises.unlink(
            path.join(__dirname, "..", "uploads", existingPost.thumbnail)
          );
        }
      } catch (err) {
        console.error("Failed to delete old thumbnail:", err);
      }

      // 🆕 Process new thumbnail
      const { thumbnail } = req.files;

      // 🛑 Validate file size (limit to 2MB)
      if (thumbnail.size > 2 * 1024 * 1024) {
        return next(
          new HttpError("Thumbnail too big. Should be less than 2MB.", 400)
        );
      }

      // 📝 Rename the file to avoid conflicts
      const fileName = thumbnail.name;
      const splittedFilename = fileName.split(".");
      const newFilename = `${splittedFilename[0]}_${uuid()}.${
        splittedFilename[splittedFilename.length - 1]
      }`;

      // 📂 Move the new thumbnail file to the uploads folder
      await thumbnail.mv(path.join(__dirname, "..", "uploads", newFilename));

      // 📝 Update post with the new thumbnail
      updatedPost = await Post.findByIdAndUpdate(
        postId,
        { title, category, description, thumbnail: newFilename },
        { new: true }
      );
    }

    // 🛑 Ensure the update was successful
    if (!updatedPost) {
      return next(new HttpError("Couldn't update post.", 400));
    }

    res.status(200).json(updatedPost);
  } catch (error) {
    return next(new HttpError(error.message || "Something went wrong.", 500));
  }
};

// edit post
// patch :api/posts/users/:id
// PROTECTED
export const deletePosts = async (req, res, next) => {
  try {
    const postId = req.params.id;
    if (!postId) {
      return next(new HttpError("Post unavailable.", 400));
    }

    const post = await Post.findById(postId);
    const fileName = post?.thumbnail;
    // delete thumbnail from uploads folder;
    if (req.user.id == post.creator) {
      fs.unlink(
        path.join(__dirname, "..", "uploads", fileName),
        async (err) => {
          if (err) {
            return next(new HttpError(err));
          } else {
            await Post.findByIdAndDelete(postId);
            // find user and reduce the post count by one
            const currentUser = await User.findById(req.user.id);
            const userPostCount = currentUser?.posts - 1;
            await User.findByIdAndUpdate(req.user.id, { posts: userPostCount });
            res.json(`Post ${postId} deteted successfully.`);
          }
        }
      );
    } else {
      return next(new HttpError("Post couldn't be deleted", 403));
    }
  } catch (error) {
    return next(new HttpError(error));
  }
};

// Register a new user
import bcrypt from "bcryptjs";
import User from "../models/userModel.js";
import HttpError from "../models/errorModels.js";
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { v4 as uuid } from "uuid";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// POST : api/users/register
export const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, password2 } = req.body;

    if (!name || !email || !password) {
      return next(new HttpError("Fill in all fields.", 422));
    }

    const newEmail = email.toLowerCase();

    // to check if the user exists
    const emailExists = await User.findOne({ email: newEmail });
    if (emailExists) {
      return next(new HttpError("Email alreadly exists.", 422));
    }

    // To check if password in less then 6
    if (password.trim().length < 6) {
      return next(new HttpError("Password should be at least 6 characters"));
    }

    // To check if password is match
    if (password != password2) {
      return next(new HttpError("passwords do not match"));
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPass = await bcrypt.hash(password, salt);
    const newUser = await User.create({
      name,
      email: newEmail,
      password: hashedPass,
    });

    res.status(201).json(`New user ${newUser.email} registered.`);
  } catch (error) {
    return next(new HttpError("User registration failed.", 422));
  }
};

// Login user
// POST : api/users/login
export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return next(new HttpError("Fill in all fields.", 422));
    }
    const newEmail = email.toLowerCase();

    const user = await User.findOne({ email: newEmail });

    if (!user) {
      return next(new HttpError("Invalid creadentials.", 422));
    }

    const comparePass = await bcrypt.compare(password, user.password);
    if (!comparePass) {
      return next(
        new HttpError("Login failed. Please check your credentials.", 422)
      );
    }

    const { _id: id, name } = user;
    const token = jwt.sign({ id, name }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.status(200).json({ token, id, name });
  } catch (error) {
    return next(new HttpError("Login failed. Please check your creadentials"));
  }
};

// User profile
// POST : api/users/:id
export const getUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select("-password");

    if (!user) {
      return next(new HttpError("User not found", 404));
    }
    res.status(200).json(user);
  } catch (error) {
    return next(new HttpError(error));
  }
};

// Change user avatar
// POST : api/users/change-avatar
export const changeAvatar = async (req, res, next) => {
  try {
    // Validate if a file was uploaded
    if (!req.files || !req.files.avatar) {
      return next(new HttpError("Please choose an image.", 422));
    }

    const { avatar } = req.files;

    // Ensure avatar has a valid name
    if (!avatar.name) {
      return next(
        new HttpError("Invalid file upload. File name missing.", 400)
      );
    }

    // Validate file size (optional)
    if (avatar.size > 500000) {
      // Limit to 500KB for example
      return next(
        new HttpError(
          "Profile picture too big. Should be less than 500KB.",
          422
        )
      );
    }

    // Find the current user (using req.user.id)
    const user = await User.findById(req.user.id);
    if (!user) {
      return next(new HttpError("User not found.", 404));
    }

    // Delete the old avatar if it exists
    if (user.avatar) {
      const oldAvatarPath = path.join(__dirname, "..", "uploads", user.avatar);
      fs.unlink(oldAvatarPath, (err) => {
        if (err && err.code !== "ENOENT") {
          console.error("Failed to delete old avatar:", err);
        }
      });
    }

    // Generate new filename (format: avatar + UUID + file extension)
    const ext = path.extname(avatar.name); // Get file extension
    const newFilename = `avatar${uuid()}${ext}`; // Example: avatar7b888db81-a9b8-42bd-a3b2-2b96a8a8ba65.jpg

    // Save the new avatar to the uploads directory
    const uploadPath = path.join(__dirname, "..", "uploads", newFilename);
    avatar.mv(uploadPath, async (err) => {
      if (err) {
        console.error("Failed to save avatar:", err);
        return next(new HttpError("Failed to upload avatar.", 500));
      }

      // Update the user's avatar in the database with the new filename
      user.avatar = newFilename;
      await user.save();

      // Respond with the updated user data
      res.status(200).json({
        message: "Avatar updated successfully",
        user,
      });
    });
  } catch (error) {
    console.error("Error in changeAvatar:", error);
    return next(new HttpError("Internal server error", 500));
  }
};

// Edit user
// POST : api/users/edit
export const editUser = async (req, res, next) => {
  try {
    const { name, email, currentPassword, newPassword, confirmNewPassword } =
      req.body;

    if (!name || !email || !currentPassword || !newPassword) {
      return next(new HttpError("Fill in all fields."));
    }

    // get user from database
    const user = await User.findById(req.user.id);
    if (!user) {
      return next(new HttpError("User not found.", 403));
    }

    //make sure new email doesn't already exist
    const emailExist = await User.findOne({ email });

    // we want to update details with/without changing the email (which is unique id because we use it to login)
    if (emailExist && emailExist._id != req.user.id) {
      return next(new HttpError("Email alreadly exist.", 422));
    }

    // compare current password to db password
    const vallidateUserPassword = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!vallidateUserPassword) {
      return next(new HttpError("Invalid current password", 422));
    }

    // compare new passwords
    if (newPassword !== confirmNewPassword) {
      return next(new HttpError("New password do not match.", 422));
    }

    //hash new password
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newPassword, salt);

    //update user info in database
    const newInfo = await User.findByIdAndUpdate(
      req.user.id,
      {
        name,
        email,
        password: hash,
      },
      { new: true }
    );

    res.status(200).json(newInfo);
  } catch (error) {
    return next(new HttpError(error));
  }
};

// Get authors
// POST : api/users/get-authors
export const getAuthors = async (req, res, next) => {
  try {
    const authors = await User.find().select("-password");
    res.json(authors);
  } catch (error) {
    return next(new HttpError(error));
  }
};

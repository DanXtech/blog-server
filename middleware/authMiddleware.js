import jwt from "jsonwebtoken";
import HttpError from "../models/errorModels.js";

export const authMiddleware = async (req, res, next) => {
  const authorization = req.headers.authorization;

  if (authorization && authorization.startsWith("Bearer ")) {
    const token = authorization.split(" ")[1]; // Fixed split logic
    jwt.verify(token, process.env.JWT_SECRET, (err, info) => {
      if (err) {
        return next(new HttpError("Unauthorized. Invalid token.", 403));
      }
      req.user = info; // Attach user info to request
      next();
    });
  } else {
    return next(new HttpError("Unauthorized. No token provided.", 402));
  }
};

// export const authMiddleware = async (req, res, next) => {
//   const Authorization = req.header.Authorization || req.header.authorization;

//   if (Authorization && Authorization.startsWith("Bearer")) {
//     const token = Authorization.split("")[1];
//     jwt.verify(token, process.env.JWT_SECRET, (err, info) => {
//       if (err) {
//         return next(new HttpError("Unauthorization. Invalid token.", 403));
//       }

//       req.user = info;
//       next();
//     });
//   } else {
//     return next(new HttpError("Unauthorization. No token", 402));
//   }
// };

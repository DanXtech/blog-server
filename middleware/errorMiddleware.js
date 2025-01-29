// Un suppoted 404 routes

export const notFound = (req, res, next) => {
  const error = new Error("Not found - ${req.originalUrl}");
  res.status(404);
  next(error);
};

// Middleware to handle Errors
export const erroHandle = (error, req, res, next) => {
  if (res.headerSent) {
    return next(error);
  }

  res
    .status(error.code || 500)
    .json({ message: error.message || "An unknow error occured" });
};

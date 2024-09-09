const AppError = require("../utils/appError");

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  // we will use regular expression to get the value between two quotes ("")
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  // we use object.value to loop through the objects inside an object
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data. ${errors.join(". ")}`;
  return new AppError(message, 400);
};

const handleJWTError = () =>
  new AppError("Invalid token. Please log in again", 401);

const handleJWTExpiredError = () =>
  new AppError("Your token has expired! Please login again.", 401);

const sendErrorDev = (err, req, res) => {
  console.error("ERROR Development 🔥", err);
  // originalUrl is basically the entire url without the host. basically, the full route
  // A) RENDER ERROR PAGE (WEBSITE A)
  if (req.originalUrl.startsWith("/api")) {
    // API
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack
    });
  }
  // we will render an error page. the error page is in view/error
  // B) RENDER ERROR PAGE (WEBSITE)
  return res.status(err.statusCode).render("error", {
    title: "Something went wrong!",
    msg: err.message
  });
};

const sendErrorProd = (err, req, res) => {
  console.error("ERROR Production 🔥", err);
  // API
  // Operational, trusted error: send message to client
  // A) API

  if (req.originalUrl.startsWith("/api")) {
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message
      });

      // programming or other unknown error: don't leak error details
    }
    // 1) Send generic message
    return res.status(500).json({
      status: "error",
      message: "Something went very wrong"
    });
  }

  // B) RENDER ERROR PAGE (WEBSITE )
  if (err.isOperational) {
    return res.status(err.statusCode).render("error", {
      title: "Something went wrong!",
      msg: err.message
    });

    // programming or other unknown error: don't leak error details
  }

  // 1) Send generic message
  return res.status(500).json({
    status: "error",
    message: "Please try again later."
  });
};

// THIS IS FOR THE EXPRESS MIDDLEWARE ERROR IN app.js
module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (process.env.NODE_ENV === "development") {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === "production") {
    let error = { ...err };
    error.message = err.message;

    // the handleCastErrorDB will assign the error operational to be true when we parse it in the AppError() class
    if (error.name === "CastError") error = handleCastErrorDB(error);

    if (error.code === 11000) error = handleDuplicateFieldsDB(error);

    if (error.name === "ValidationError")
      error = handleValidationErrorDB(error);

    if (error.name === "JsonWebTokenError") error = handleJWTError();

    if (error.name === "TokenExpiredError") error = handleJWTExpiredError();

    sendErrorProd(error, req, res);
  }
};

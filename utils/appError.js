class AppError extends Error {
  constructor(message, statusCode) {
    // we call he parent constructor
    // our error message will be set in the parent class using that super().
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true;

    // This will help us to see where the error is occuring in our terminal. when the constructor function is clalled, the constructor function will not show  in the stactTract
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;

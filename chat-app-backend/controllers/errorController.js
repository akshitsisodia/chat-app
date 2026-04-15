const devErrors = (res, error) => {
  res.status(error.statusCode).json({
    status: error.status,
    message: error.message,
    stackTrace: error.stack,
    error,
  });
};

module.exports = (error, req, res, next) => {
  error.statusCode = error?.statusCode || 500;

  if (process.env.NODE_ENV === "development") {
    devErrors(res, error);
  } else {
    res.status(error.statusCode).json({
      status: error.status,
      message: error.message || "Internal Server Error",
    });
  }
};

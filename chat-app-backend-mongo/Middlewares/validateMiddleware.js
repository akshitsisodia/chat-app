const validate = (schema) => (req, res, next) => {
  try {
    schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    next();
  } catch (err) {
    const parcedError = JSON.parse(err.message);
    return res.status(400).json({
      status: "failed",
      // message: "Validation error",
      message: parcedError[0].message,
      errors: err,
    });
  }
};

module.exports = validate;

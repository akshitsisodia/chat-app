const CustomError = require("../utils/CustomError");

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
    return next(new CustomError(parcedError[0].message, 400));
  }
};

module.exports = validate;

const { ZodError } = require('zod');
const { BAD_REQUEST } = require('../libs/constants');

exports.validate = (schema) => (req, res, next) => {
  try {
    schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(BAD_REQUEST).json({
        errors: error.errors.map((e) => ({
          path: e.path.join("."),
          message: e.message,
        })),
      });
    }
    next(error);
  }
};

const validate = (schema) => (req, res, next) => {
  try {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      const formattedErrors = {};
      parsed.error.errors.forEach((err) => {
        const field = err.path.join('.') || 'error';
        formattedErrors[field] = err.message;
      });
      return res.status(400).json({
        error: 'Validation failed',
        details: formattedErrors,
      });
    }
    req.body = parsed.data;
    next();
  } catch (error) {
    return res.status(500).json({ error: 'Internal validation error' });
  }
};

module.exports = validate;

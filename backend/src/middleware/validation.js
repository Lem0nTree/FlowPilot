const { body, validationResult } = require('express-validator');

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Invalid request data',
      details: errors.array()
    });
  }
  next();
};

// Validation rules
const validateFlowAddress = body('address')
  .isString()
  .matches(/^0x[a-fA-F0-9]{16}$/)
  .withMessage('Invalid Flow address format');

const validateAgentUpdate = [
  body('nickname')
    .optional()
    .isString()
    .isLength({ min: 1, max: 50 })
    .withMessage('Nickname must be between 1 and 50 characters'),
  body('description')
    .optional()
    .isString()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('tags.*')
    .optional()
    .isString()
    .isLength({ min: 1, max: 20 })
    .withMessage('Each tag must be between 1 and 20 characters')
];

const validateUserUpdate = [
  body('nickname')
    .optional()
    .isString()
    .isLength({ min: 1, max: 50 })
    .withMessage('Nickname must be between 1 and 50 characters'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Invalid email format')
];

module.exports = {
  validateRequest,
  validateFlowAddress,
  validateAgentUpdate,
  validateUserUpdate
};

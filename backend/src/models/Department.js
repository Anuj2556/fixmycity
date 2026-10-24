const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema(
  {
    _id: {
      type: mongoose.Schema.Types.Mixed,
      default: () => new mongoose.Types.ObjectId().toString(),
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    description: {
      type: String,
      default: '',
    },
    head_officer: {
      type: String,
      default: '',
    },
    icon: {
      type: String,
      default: '🏢',
    },
    email: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual id for compatibility with frontend expectations
departmentSchema.virtual('id').get(function () {
  return String(this._id);
});

const Department = mongoose.model('Department', departmentSchema);

module.exports = Department;

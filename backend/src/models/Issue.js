const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema(
  {
    _id: {
      type: mongoose.Schema.Types.Mixed,
      default: () => new mongoose.Types.ObjectId().toString(),
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ['roads', 'water', 'electricity', 'sanitation', 'other'],
      default: 'other',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'resolved'],
      default: 'pending',
    },
    photo: {
      type: String,
      default: null,
    },
    latitude: {
      type: Number,
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },
    department: {
      type: mongoose.Schema.Types.Mixed,
      ref: 'Department',
      default: null,
    },
    submitted_by: {
      type: mongoose.Schema.Types.Mixed,
      ref: 'User',
      required: true,
    },
    ai_confidence: {
      type: Number,
      default: 0.0,
    },
    ai_reasoning: {
      type: String,
      default: '',
    },
    department_notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual id for compatibility with frontend expectations
issueSchema.virtual('id').get(function () {
  return String(this._id);
});

// Geospatial 2dsphere index for location queries
issueSchema.index({ location: '2dsphere' });
issueSchema.index({ status: 1, priority: 1, department: 1 });

const Issue = mongoose.model('Issue', issueSchema);

module.exports = Issue;

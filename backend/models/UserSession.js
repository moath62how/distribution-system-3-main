const mongoose = require('mongoose');

const userSessionSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  token_hash: {
    type: String,
    required: true,
    unique: true  // This creates an index automatically
  },
  expires_at: {
    type: Date,
    required: true
  },
  ip_address: {
    type: String
  },
  user_agent: {
    type: String
  },
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for performance
// Note: token_hash already has unique index from schema definition above
userSessionSchema.index({ user_id: 1, active: 1 });

// Automatically remove expired sessions (TTL index)
userSessionSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('UserSession', userSessionSchema);
const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Class name is required'],
    trim: true,
    maxlength: [100, 'Class name cannot exceed 100 characters']
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  students: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'User',
    default: []
  },
  inviteCode: {
    type: String,
    required: true,
    unique: true,
    index: true,
    minlength: [6, 'Invite code must be at least 6 characters'],
    maxlength: [8, 'Invite code cannot exceed 8 characters'],
    match: [/^[A-Z0-9]{6,8}$/, 'Invite code must be 6–8 alphanumeric characters']
  }
}, { timestamps: true });

// Generate a short invite code if not provided (6–8 characters, plan spec)
classSchema.pre('validate', function(next) {
  if (this.inviteCode) {
    this.inviteCode = String(this.inviteCode).toUpperCase().trim();
  } else {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
    const len = 6 + Math.floor(Math.random() * 3);
    let code = '';
    for (let i = 0; i < len; i++) code += chars[Math.floor(Math.random() * chars.length)];
    this.inviteCode = code;
  }
  next();
});

classSchema.index({ teacher: 1, inviteCode: 1 });

module.exports = mongoose.model('Class', classSchema);

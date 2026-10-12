const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const adminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Admin name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Admin email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*\.\w{2,}$/, 'Please fill a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
    },
    role: {
      type: String,
      enum: ['admin'],
      default: 'admin',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
  },
  { timestamps: true }
)

// No pre-save hook - password is hashed externally

adminSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password)
}

module.exports = mongoose.model('Admin', adminSchema)
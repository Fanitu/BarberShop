// models/User.js
const mongoose = require('mongoose');

// User Schema - like a blueprint for user information
const userSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true  // This means we MUST have a name
  },
  email: { 
    type: String, 
    required: true, 
    unique: true  // No two users can have same email
  },
  phone: { 
    type: String, 
    required: true 
  }
}, { timestamps: true }); // automatically adds "createdAt" and "updatedAt"

module.exports = mongoose.model('User', userSchema);
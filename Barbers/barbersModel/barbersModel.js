// models/Barber.js
const mongoose = require('mongoose');

const barberSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  specialization: { 
    type: String, 
    default: 'Haircut'  // If not specified, default to 'Haircut'
  },
  isAvailable: { 
    type: Boolean, 
    default: true  // Barber is available by default
  }
}, { timestamps: true });

module.exports = mongoose.model('Barber', barberSchema);
const express = require('express');
const router = express.Router();

const { getAllBarbers,createNewBarber } = require('../barberscontroller/barbersControllers');

// 🎯 ROUTE 3: Get all barbers (for dropdown selection)
router.get('/', getAllBarbers)
.post('/',createNewBarber);

module.exports = router;
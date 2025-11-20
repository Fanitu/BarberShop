const Barber = require('../barbersModel/barbersModel');

const createNewBarber = async (req, res) => {
    const { name, specialization } = req.body;
    if (!name) {
        return res.status(400).json({ success: false, message: 'Name is required' });
    }
    try {
        const newBarber = await Barber.create({ name, specialization });
        res.status(201).json({ success: true, data: newBarber });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error creating barber' });
    }
}
const getAllBarbers = async (req, res) => {
  try {
    const barbers = await Barber.find({ isAvailable: true });
    res.json({
      success: true,
      data: barbers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching barbers'
    });
  }
};


module.exports = {
  createNewBarber,
  getAllBarbers
};
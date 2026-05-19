const mongoose = require('mongoose');
const Class = require('../models/Class');
const User = require('../models/User');

const createClass = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Class name is required' });
    }

    const newClass = new Class({ name, teacher: req.user.userId });
    await newClass.save();

    return res.status(201).json({ success: true, class: newClass });
  } catch (error) {
    console.error('Create class error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create class' });
  }
};

const getTeacherClasses = async (req, res) => {
  try {
    const classes = await Class.find({ teacher: req.user.userId }).populate('students', 'fullName email');
    return res.json({ success: true, classes });
  } catch (error) {
    console.error('Get teacher classes error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch classes' });
  }
};

const joinClass = async (req, res) => {
  try {
    const { inviteCode } = req.body;
    if (!inviteCode) return res.status(400).json({ success: false, message: 'inviteCode is required' });

    const studentId = req.user.userId;
    const sid = new mongoose.Types.ObjectId(studentId);

    const classObj = await Class.findOne({ inviteCode: String(inviteCode).toUpperCase().trim() });
    if (!classObj) return res.status(404).json({ success: false, message: 'Class not found' });

    if (classObj.students.some((id) => id.equals(sid))) {
      return res.json({ success: true, message: 'Already joined', class: classObj });
    }

    classObj.students.push(sid);
    await classObj.save();

    return res.json({ success: true, message: 'Joined class successfully', class: classObj });
  } catch (error) {
    console.error('Join class error:', error);
    return res.status(500).json({ success: false, message: 'Failed to join class' });
  }
};

const getStudentClasses = async (req, res) => {
  try {
    const classes = await Class.find({ students: req.user.userId }).populate('teacher', 'fullName email');
    return res.json({ success: true, classes });
  } catch (error) {
    console.error('Get student classes error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch classes' });
  }
};

module.exports = {
  createClass,
  getTeacherClasses,
  joinClass,
  getStudentClasses,
};

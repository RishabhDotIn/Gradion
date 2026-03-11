const Assignment = require('../models/Assignment');

// Create Assignment - POST /api/assignments
const createAssignment = async (req, res) => {
  try {
    const { title, description, deadline } = req.body;

    // Validation
    if (!title || !description || !deadline) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, and deadline are required'
      });
    }

    const assignment = new Assignment({
      title,
      description,
      deadline,
      createdBy: req.user.userId
    });

    await assignment.save();

    return res.status(201).json({
      success: true,
      message: 'Assignment created successfully',
      assignment
    });
  } catch (error) {
    console.error('Create assignment error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while creating assignment',
      error: error.message
    });
  }
};

// Get All Assignments - GET /api/assignments
const getAllAssignments = async (req, res) => {
  try {
    const assignments = await Assignment.find({})
      .populate('createdBy', 'fullName email role')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: assignments.length,
      assignments
    });
  } catch (error) {
    console.error('Get assignments error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching assignments',
      error: error.message
    });
  }
};

// Get Single Assignment - GET /api/assignments/:id
const getAssignmentById = async (req, res) => {
  try {
    const { id } = req.params;

    const assignment = await Assignment.findById(id)
      .populate('createdBy', 'fullName email role');

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    return res.status(200).json({
      success: true,
      assignment
    });
  } catch (error) {
    console.error('Get assignment by id error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching assignment',
      error: error.message
    });
  }
};

// Update Assignment - PUT /api/assignments/:id
const updateAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, deadline, status } = req.body;

    const assignment = await Assignment.findById(id);

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    // Only creator can update
    if (assignment.createdBy.toString() !== req.user.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this assignment'
      });
    }

    if (title) assignment.title = title;
    if (description) assignment.description = description;
    if (deadline) assignment.deadline = deadline;
    if (status) assignment.status = status;

    await assignment.save();

    return res.status(200).json({
      success: true,
      message: 'Assignment updated successfully',
      assignment
    });
  } catch (error) {
    console.error('Update assignment error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while updating assignment',
      error: error.message
    });
  }
};

// Delete Assignment - DELETE /api/assignments/:id
const deleteAssignment = async (req, res) => {
  try {
    const { id } = req.params;

    const assignment = await Assignment.findById(id);

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    // Only creator can delete
    if (assignment.createdBy.toString() !== req.user.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this assignment'
      });
    }

    await Assignment.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Assignment deleted successfully'
    });
  } catch (error) {
    console.error('Delete assignment error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while deleting assignment',
      error: error.message
    });
  }
};

module.exports = {
  createAssignment,
  getAllAssignments,
  getAssignmentById,
  updateAssignment,
  deleteAssignment
};
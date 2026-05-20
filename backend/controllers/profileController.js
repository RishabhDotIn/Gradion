const Profile = require('../models/Profile');
const User = require('../models/User');
const path = require('path');
const fs = require('fs');

// @desc    Get user profile
// @route   GET /api/profile
// @access  Private
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    let profile = await Profile.findOne({ user: req.user.userId });
    
    // If profile doesn't exist, create a blank one
    if (!profile) {
      profile = await Profile.create({ user: req.user.userId });
    }

    res.json({
      success: true,
      data: {
        user: {
          fullName: user.fullName,
          email: user.email,
          role: user.role,
        },
        profile
      }
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ success: false, message: 'Server error fetching profile' });
  }
};

// @desc    Update user profile details
// @route   PUT /api/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const { phoneNumber, collegeName } = req.body;
    
    let profile = await Profile.findOne({ user: req.user.userId });
    if (!profile) {
      profile = new Profile({ user: req.user.userId });
    }

    if (phoneNumber !== undefined) profile.phoneNumber = phoneNumber;
    if (collegeName !== undefined) profile.collegeName = collegeName;

    await profile.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: profile
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ success: false, message: 'Server error updating profile' });
  }
};

// @desc    Upload profile image
// @route   POST /api/profile/image
// @access  Private
exports.uploadProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image uploaded' });
    }

    let profile = await Profile.findOne({ user: req.user.userId });
    if (!profile) {
      profile = new Profile({ user: req.user.userId });
    }

    // Delete old image if it exists
    if (profile.profileImage) {
      const oldImagePath = path.join(__dirname, '..', profile.profileImage);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }

    // Save relative path: e.g. /uploads/profiles/filename.jpg
    profile.profileImage = '/uploads/profiles/' + req.file.filename;
    await profile.save();

    res.json({
      success: true,
      message: 'Profile image uploaded successfully',
      data: profile
    });
  } catch (error) {
    console.error('Error uploading profile image:', error);
    res.status(500).json({ success: false, message: 'Server error uploading profile image' });
  }
};

// @desc    Change user password
// @route   PUT /api/profile/password
// @access  Private
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Please provide current and new password' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long' });
    }

    const user = await User.findById(req.user.userId).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Incorrect current password' });
    }

    // The pre-save hook in User model will hash the password
    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ success: false, message: 'Server error changing password' });
  }
};

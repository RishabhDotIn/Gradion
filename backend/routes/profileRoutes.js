const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/authMiddleware');
const { profileUpload, handleProfileUploadError } = require('../middleware/profileUploadMiddleware');
const {
  getProfile,
  updateProfile,
  uploadProfileImage,
  changePassword
} = require('../controllers/profileController');

// All profile routes require authentication
router.use(auth);

router.route('/')
  .get(getProfile)
  .put(updateProfile);

router.post('/image', profileUpload.single('image'), handleProfileUploadError, uploadProfileImage);

router.put('/password', changePassword);

module.exports = router;

const express = require("express");
const { auth } = require("../middleware/authMiddleware");
const {
  getMailboxNotifications,
  markMailboxAsRead,
  renderMailboxView,
} = require("../controllers/mailboxController");

const router = express.Router();

router.use(auth);
router.get("/", getMailboxNotifications);
router.put("/read", markMailboxAsRead);
router.get("/view", renderMailboxView);

module.exports = router;

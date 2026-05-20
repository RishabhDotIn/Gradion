const MailboxNotification = require("../models/MailboxNotification");
const User = require("../models/User");

const getMailboxNotifications = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);

    const notifications = await MailboxNotification.find({ user: req.user.userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const unreadCount = await MailboxNotification.countDocuments({
      user: req.user.userId,
      read: false,
    });

    return res.json({
      success: true,
      notifications,
      unreadCount,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch mailbox notifications",
      error: error.message,
    });
  }
};

const markMailboxAsRead = async (req, res) => {
  try {
    await MailboxNotification.updateMany(
      { user: req.user.userId, read: false },
      { $set: { read: true } }
    );

    return res.json({
      success: true,
      message: "Mailbox marked as read",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update mailbox notifications",
      error: error.message,
    });
  }
};

const renderMailboxView = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("fullName").lean();
    const notifications = await MailboxNotification.find({ user: req.user.userId })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    return res.render("mailbox", {
      notifications,
      userName: user?.fullName || "Student",
    });
  } catch (error) {
    return res.status(500).send("Failed to render mailbox view");
  }
};

module.exports = {
  getMailboxNotifications,
  markMailboxAsRead,
  renderMailboxView,
};

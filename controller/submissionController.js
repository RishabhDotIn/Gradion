const Submission = require("../models/Submission");

exports.submitCode = async (req, res) => {
  try {
    const { assignmentId, code } = req.body;

    const studentId = req.user.id;

    const submission = new Submission({
      studentId,
      assignmentId,
      code
    });

    await submission.save();

    res.json({
      success: true,
      message: "Submission stored successfully"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Submission failed"
    });
  }
};

exports.getSubmissions = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    const submissions = await Submission.find({ assignmentId });

    res.json({
      success: true,
      submissions
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching submissions"
    });
  }
};
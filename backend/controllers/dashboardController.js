const mongoose = require('mongoose');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const Class = require('../models/Class');

const teacherDashboard = async (req, res) => {
  try {
    const teacherId = req.user.userId;
    const teacherOid = new mongoose.Types.ObjectId(teacherId);

    const classes = await Class.find({ teacher: teacherId }).select('_id');
    const classIds = classes.map((c) => c._id);

    const totalStudentsAgg = await Class.aggregate([
      { $match: { teacher: teacherOid } },
      { $project: { studentCount: { $size: { $ifNull: ['$students', []] } } } },
      { $group: { _id: null, totalStudents: { $sum: '$studentCount' } } },
    ]);

    const totalStudents = (totalStudentsAgg[0] && totalStudentsAgg[0].totalStudents) || 0;

    const assignmentIds = (await Assignment.find({ teacher: teacherId }).select('_id')).map((a) => a._id);

    const totalAssignments = await Assignment.countDocuments({ teacher: teacherId });
    const totalSubmissions = await Submission.countDocuments({ assignment: { $in: assignmentIds } });
    const pendingReviews = await Submission.countDocuments({
      assignment: { $in: assignmentIds },
      $or: [{ status: 'Pending' }, { plagiarismScore: { $gte: 75 } }],
    });

    // compute previous-week snapshot for teacher metrics
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const prevTotalStudentsAgg = await Class.aggregate([
      { $match: { teacher: teacherOid, createdAt: { $lte: oneWeekAgo } } },
      { $project: { studentCount: { $size: { $ifNull: ['$students', []] } } } },
      { $group: { _id: null, totalStudents: { $sum: '$studentCount' } } },
    ]);
    const prevTotalStudents = (prevTotalStudentsAgg[0] && prevTotalStudentsAgg[0].totalStudents) || 0;

    const prevTotalAssignments = (await Assignment.countDocuments({ teacher: teacherId, createdAt: { $lte: oneWeekAgo } })) || 0;

    const prevTotalSubmissions = (await Submission.countDocuments({ assignment: { $in: assignmentIds }, submittedAt: { $lte: oneWeekAgo } })) || 0;

    const prevPendingReviews = (await Submission.countDocuments({ assignment: { $in: assignmentIds }, $or: [{ status: 'Pending' }, { plagiarismScore: { $gte: 75 } }], submittedAt: { $lte: oneWeekAgo } })) || 0;

    return res.json({
      success: true,
      totalStudents,
      totalAssignments,
      totalSubmissions,
      pendingReviews,
      previousWeek: {
        totalStudents: prevTotalStudents,
        totalAssignments: prevTotalAssignments,
        totalSubmissions: prevTotalSubmissions,
        pendingReviews: prevPendingReviews,
      },
    });
  } catch (error) {
    console.error('Teacher dashboard error:', error);
    return res.status(500).json({ success: false, message: 'Failed to load teacher dashboard' });
  }
};

const studentDashboard = async (req, res) => {
  try {
    const studentId = req.user.userId;
    const studentOid = new mongoose.Types.ObjectId(studentId);

    const enrolled = await Class.find({ students: studentOid }).select('_id').lean();
    const classIds = enrolled.map((c) => c._id);

    const totalAssignments = classIds.length
      ? await Assignment.countDocuments({ status: 'published', classId: { $in: classIds } })
      : 0;

    const gradedAssignmentIds = await Submission.distinct('assignment', {
      student: studentOid,
      status: { $in: ['Graded', 'Late'] },
    });
    const completedAssignments = gradedAssignmentIds.length;
    const pendingAssignments = Math.max(0, totalAssignments - completedAssignments);

    const avgAgg = await Submission.aggregate([
      {
        $match: {
          student: studentOid,
          score: { $ne: null, $exists: true },
          status: { $in: ['Graded', 'Late'] },
        },
      },
      { $group: { _id: null, avgScore: { $avg: '$score' } } },
    ]);

    const averageScore = Math.round((avgAgg[0] && avgAgg[0].avgScore) || 0);

    // Compute previous-week snapshot for simple trend percentages
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // total assignments as of one week ago: assignments that were published before or on oneWeekAgo
    const prevTotalAssignments = classIds.length
      ? await Assignment.countDocuments({ status: 'published', classId: { $in: classIds }, createdAt: { $lte: oneWeekAgo } })
      : 0;

    // completed assignments as of one week ago
    const prevCompletedAgg = await Submission.aggregate([
      {
        $match: {
          student: studentOid,
          status: { $in: ['Graded', 'Late'] },
          submittedAt: { $lte: oneWeekAgo },
        },
      },
      { $group: { _id: '$assignment' } },
      { $count: 'count' },
    ]);
    const prevCompletedAssignments = (prevCompletedAgg[0] && prevCompletedAgg[0].count) || 0;

    // average score as of one week ago
    const prevAvgAgg = await Submission.aggregate([
      {
        $match: {
          student: studentOid,
          status: { $in: ['Graded', 'Late'] },
          submittedAt: { $lte: oneWeekAgo },
          score: { $ne: null, $exists: true },
        },
      },
      { $group: { _id: null, avgScore: { $avg: '$score' } } },
    ]);
    const prevAverageScore = Math.round((prevAvgAgg[0] && prevAvgAgg[0].avgScore) || 0);

    return res.json({
      success: true,
      totalAssignments,
      completedAssignments,
      pendingAssignments,
      averageScore,
      previousWeek: {
        totalAssignments: prevTotalAssignments,
        completedAssignments: prevCompletedAssignments,
        pendingAssignments: Math.max(0, prevTotalAssignments - prevCompletedAssignments),
        averageScore: prevAverageScore,
      },
    });
  } catch (error) {
    console.error('Student dashboard error:', error);
    return res.status(500).json({ success: false, message: 'Failed to load student dashboard' });
  }
};

module.exports = { teacherDashboard, studentDashboard };

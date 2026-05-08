const Result = require("../models/Result");
const Exam = require("../models/Exam");
const Student = require("../models/Student");

exports.getResults = async (req, res) => {
  try {
    const { examId, search, page = 1, limit = 50 } = req.query;
    const query = {};
    if (examId) query.exam = examId;

    if (search) {
      const studentMatches = await Student.find({
        $or: [
          { name: { $regex: search, $options: "i" } },
          { studentId: { $regex: search, $options: "i" } },
        ],
      }).select("_id");

      query.student = { $in: studentMatches.map((student) => student._id) };
    }

    const numericPage = Number(page);
    const numericLimit = Number(limit);

    const results = await Result.find(query)
      .populate("student", "name studentId batch")
      .populate("exam", "title passingMarks totalQuestions")
      .sort({ createdAt: -1 })
      .skip((numericPage - 1) * numericLimit)
      .limit(numericLimit);

    const total = await Result.countDocuments(query);
    res.json({ results, total, page: numericPage, totalPages: Math.ceil(total / numericLimit) });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.getStudentResults = async (req, res) => {
  try {
    const results = await Result.find({ student: req.user.id })
      .populate("exam", "title passingMarks totalQuestions durationMinutes")
      .sort({ createdAt: -1 });
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.getResultDetail = async (req, res) => {
  try {
    const result = await Result.findById(req.params.id)
      .populate("student", "name studentId batch")
      .populate("exam", "title passingMarks totalQuestions marksPerQuestion negativeMarking");

    if (!result) return res.status(404).json({ message: "Result not found" });

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.getExamStats = async (req, res) => {
  try {
    const examId = req.params.examId;
    const results = await Result.find({ exam: examId, status: "submitted" });

    const total = results.length;
    const passed = results.filter((r) => r.passed).length;
    const avgScore = total > 0 ? Math.round(results.reduce((s, r) => s + r.percentage, 0) / total) : 0;
    const highest = total > 0 ? Math.max(...results.map((r) => r.percentage)) : 0;
    const lowest = total > 0 ? Math.min(...results.map((r) => r.percentage)) : 0;

    res.json({ total, passed, failed: total - passed, passPercent: total > 0 ? Math.round((passed / total) * 100) : 0, avgScore, highest, lowest });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.deleteResult = async (req, res) => {
  try {
    const result = await Result.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ message: "Result not found" });
    res.json({ message: "Result deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

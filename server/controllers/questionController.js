const Question = require("../models/Question");

exports.getQuestions = async (req, res) => {
  try {
    const { subject, difficulty, search, page = 1, limit = 50 } = req.query;
    const query = { isActive: true };
    if (subject) query.subject = subject;
    if (difficulty) query.difficulty = difficulty;
    if (search) query.question = new RegExp(search, "i");

    const questions = await Question.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit));
    const total = await Question.countDocuments(query);

    res.json({ questions, total, page: Number(page), totalPages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.createQuestion = async (req, res) => {
  try {
    const question = await Question.create(req.body);
    res.status(201).json(question);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.updateQuestion = async (req, res) => {
  try {
    const question = await Question.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!question) return res.status(404).json({ message: "Question not found" });
    res.json(question);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.deleteQuestion = async (req, res) => {
  try {
    const question = await Question.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!question) return res.status(404).json({ message: "Question not found" });
    res.json({ message: "Question deactivated" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.bulkImportQuestions = async (req, res) => {
  try {
    const { questions } = req.body;
    const created = await Question.insertMany(questions);
    res.json({ created: created.length });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.getSubjects = async (req, res) => {
  try {
    const subjects = await Question.distinct("subject", { isActive: true });
    res.json(subjects);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

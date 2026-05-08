const bcrypt = require("bcryptjs");
const Student = require("../models/Student");
const Admin = require("../models/Admin");
const Exam = require("../models/Exam");
const Result = require("../models/Result");
const Question = require("../models/Question");
const Branding = require("../models/Branding");

exports.getDashboardStats = async (req, res) => {
  try {
    const [totalStudents, totalExams, totalQuestions, totalResults, recentResults] = await Promise.all([
      Student.countDocuments({ isActive: true }),
      Exam.countDocuments(),
      Question.countDocuments({ isActive: true }),
      Result.countDocuments(),
      Result.find().populate("student", "name studentId").populate("exam", "title").sort({ createdAt: -1 }).limit(10),
    ]);

    const passCount = await Result.countDocuments({ passed: true });
    const passPercent = totalResults > 0 ? Math.round((passCount / totalResults) * 100) : 0;

    res.json({ totalStudents, totalExams, totalQuestions, totalResults, passPercent, recentResults });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.getBranding = async (req, res) => {
  try {
    const branding = await Branding.findOne({ singletonKey: "branding" });
    res.json(branding || null);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.updateBranding = async (req, res) => {
  try {
    const allowedFields = [
      "instituteName",
      "address",
      "certificateFooter",
      "logoUrl",
      "principalName",
      "signatureUrl",
      "resultInstructions",
    ];

    const update = allowedFields.reduce((acc, key) => {
      if (Object.prototype.hasOwnProperty.call(req.body, key)) {
        acc[key] = req.body[key];
      }
      return acc;
    }, {});

    const branding = await Branding.findOneAndUpdate(
      { singletonKey: "branding" },
      { $set: update, $setOnInsert: { singletonKey: "branding" } },
      { new: true, upsert: true }
    );

    res.json(branding);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.getStudents = async (req, res) => {
  try {
    const { search, batch, page = 1, limit = 50 } = req.query;
    const query = {};
    if (search) query.$or = [{ name: new RegExp(search, "i") }, { studentId: new RegExp(search, "i") }, { email: new RegExp(search, "i") }];
    if (batch) query.batch = batch;

    const students = await Student.find(query).select("-password").sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit));
    const total = await Student.countDocuments(query);

    res.json({ students, total, page: Number(page), totalPages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.createStudent = async (req, res) => {
  try {
    const { name, email, mobile, studentId, password, batch, course } = req.body;
    const existing = await Student.findOne({ $or: [{ studentId }, { email: email || undefined }] });
    if (existing) return res.status(400).json({ message: "Student ID or Email already exists" });

    const hash = await bcrypt.hash(password || studentId, 10);
    const student = await Student.create({ name, email, mobile, studentId, password: hash, batch, course });
    const { password: _, ...studentData } = student.toObject();
    res.status(201).json(studentData);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.updateStudent = async (req, res) => {
  try {
    const { name, email, mobile, batch, course, isActive, password } = req.body;
    const update = { name, email, mobile, batch, course, isActive };
    if (password) update.password = await bcrypt.hash(password, 10);

    const student = await Student.findByIdAndUpdate(req.params.id, update, { new: true }).select("-password");
    if (!student) return res.status(404).json({ message: "Student not found" });
    res.json(student);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.deleteStudent = async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) return res.status(404).json({ message: "Student not found" });
    await Result.deleteMany({ student: req.params.id });
    res.json({ message: "Student deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.bulkImportStudents = async (req, res) => {
  try {
    const { students } = req.body;
    const created = [];
    const errors = [];

    for (const s of students) {
      try {
        const existing = await Student.findOne({ $or: [{ studentId: s.studentId }, { email: s.email || undefined }] });
        if (existing) { errors.push(`${s.studentId}: already exists`); continue; }
        const hash = await bcrypt.hash(s.password || s.studentId, 10);
        const student = await Student.create({ ...s, password: hash });
        created.push({ id: student._id, studentId: student.studentId, name: student.name });
      } catch (e) {
        errors.push(`${s.studentId}: ${e.message}`);
      }
    }

    res.json({ created: created.length, errors });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.getBatches = async (req, res) => {
  try {
    const batches = await Student.distinct("batch");
    res.json(batches.filter(Boolean));
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.getAdmins = async (req, res) => {
  try {
    const admins = await Admin.find().select("-password").sort({ createdAt: -1 });
    res.json(admins);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.createAdmin = async (req, res) => {
  try {
    const { name, email, username, password, role } = req.body;
    const emailLower = email.toLowerCase();

    if (await Admin.findOne({ email: emailLower })) {
      return res.status(400).json({ message: "Admin email already exists" });
    }

    const usernameLower = username?.toLowerCase();
    if (usernameLower && (await Admin.findOne({ username: usernameLower }))) {
      return res.status(400).json({ message: "Admin user ID already exists" });
    }

    const hash = await bcrypt.hash(password, 10);
    const admin = await Admin.create({ name, email: emailLower, username: usernameLower, password: hash, role });
    const { password: _, ...adminData } = admin.toObject();
    res.status(201).json(adminData);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

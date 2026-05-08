const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
    mobile: { type: String, trim: true },
    studentId: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true },
    batch: { type: String, trim: true },
    course: { type: String, trim: true },
    highestQualification: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Student", studentSchema);

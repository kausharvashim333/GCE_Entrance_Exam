const mongoose = require("mongoose");

const examSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    subjects: [{ type: String }],
    selectedQuestions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Question" }],
    totalQuestions: { type: Number, required: true },
    durationMinutes: { type: Number, required: true },
    passingMarks: { type: Number, required: true },
    marksPerQuestion: { type: Number, default: 1 },
    negativeMarking: { type: Number, default: 0 },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    assignedStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: "Student" }],
    assignToAll: { type: Boolean, default: false },
    shuffleQuestions: { type: Boolean, default: true },
    shuffleOptions: { type: Boolean, default: true },
    showResultImmediately: { type: Boolean, default: true },
    enableSecurity: { type: Boolean, default: true },
    disableTabSwitch: { type: Boolean, default: true },
    disableCopyPaste: { type: Boolean, default: true },
    disableRightClick: { type: Boolean, default: true },
    disableDevTools: { type: Boolean, default: true },
    enforceFullscreen: { type: Boolean, default: true },
    status: { type: String, enum: ["draft", "scheduled", "ongoing", "completed"], default: "draft" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Exam", examSchema);

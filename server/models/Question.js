const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
  {
    subject: { type: String, required: true, trim: true },
    topic: { type: String, trim: true },
    question: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctAnswer: { type: Number, required: true },
    difficulty: { type: String, enum: ["easy", "medium", "hard"], default: "medium" },
    marks: { type: Number, default: 1 },
    explanation: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Question", questionSchema);

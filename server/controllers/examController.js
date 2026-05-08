const Exam = require("../models/Exam");
const Question = require("../models/Question");
const Result = require("../models/Result");
const Student = require("../models/Student");

const shuffleArray = (items) => {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

exports.getExams = async (req, res) => {
  try {
    const exams = await Exam.find().populate("createdBy", "name").sort({ createdAt: -1 });
    res.json(exams);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.createExam = async (req, res) => {
  try {
    const exam = await Exam.create({ ...req.body, createdBy: req.user.id });
    res.status(201).json(exam);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.updateExam = async (req, res) => {
  try {
    const exam = await Exam.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!exam) return res.status(404).json({ message: "Exam not found" });
    res.json(exam);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.deleteExam = async (req, res) => {
  try {
    const exam = await Exam.findByIdAndDelete(req.params.id);
    if (!exam) return res.status(404).json({ message: "Exam not found" });
    await Result.deleteMany({ exam: req.params.id });
    res.json({ message: "Exam deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.getStudentExams = async (req, res) => {
  try {
    const now = new Date();
    const studentId = req.user.id;

    const exams = await Exam.find({
      $or: [{ assignedStudents: studentId }, { assignToAll: true }],
    }).populate("createdBy", "name").sort({ startTime: 1 });

    const attempted = await Result.find({ student: studentId }).select("exam status totalScore passed");
    const attemptedMap = {};
    attempted.forEach((r) => (attemptedMap[r.exam.toString()] = r));

    const enriched = exams.map((e) => {
      const examObj = e.toObject();
      const result = attemptedMap[e._id.toString()];
      if (result) {
        examObj.attempted = true;
        examObj.resultStatus = result.status;
        examObj.score = result.totalScore;
        examObj.passed = result.passed;
      } else {
        examObj.attempted = false;
      }
      return examObj;
    });

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.startExam = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ message: "Exam not found" });
    if (!["scheduled", "ongoing", "active"].includes(exam.status)) {
      return res.status(400).json({ message: "Exam is not available" });
    }

    const now = new Date();
    // Temporarily disable time validation for testing
    // if (now < exam.startTime) return res.status(400).json({ message: "Exam has not started yet" });
    // if (now > exam.endTime) return res.status(400).json({ message: "Exam has ended" });

    let result = await Result.findOne({ student: req.user.id, exam: exam._id });
    if (result && result.status === "submitted") {
      return res.status(400).json({ message: "You have already submitted this exam" });
    }

    if (!result) {
      const query = { isActive: true };
      if (Array.isArray(exam.selectedQuestions) && exam.selectedQuestions.length > 0) {
        query._id = { $in: exam.selectedQuestions };
      } else if (Array.isArray(exam.subjects) && exam.subjects.length > 0) {
        query.subject = { $in: exam.subjects };
      }

      let questions = await Question.find(query);
      if (exam.shuffleQuestions) {
        questions = shuffleArray(questions);
      }
      questions = questions.slice(0, exam.totalQuestions);

      const answers = questions.map((q) => {
        let optionEntries = q.options.map((optionText, index) => ({ optionText, originalIndex: index }));
        if (exam.shuffleOptions) {
          optionEntries = shuffleArray(optionEntries);
        }
        return {
          questionId: q._id,
          options: optionEntries.map((entry) => entry.optionText),
          optionOrder: optionEntries.map((entry) => entry.originalIndex),
          selectedOption: null,
          isCorrect: false,
          marksObtained: 0,
        };
      });

      result = await Result.create({
        student: req.user.id,
        exam: exam._id,
        answers,
        totalMarks: questions.length * exam.marksPerQuestion,
        status: "in_progress",
      });
    }

    const questionsData = await Question.find({ _id: { $in: result.answers.map((a) => a.questionId) } });
    const questionMap = {};
    questionsData.forEach((question) => {
      questionMap[question._id.toString()] = question;
    });

    const response = {
      resultId: result._id,
      examId: exam._id,
      title: exam.title,
      durationMinutes: exam.durationMinutes,
      totalQuestions: result.answers.length,
      passingMarks: exam.passingMarks,
      marksPerQuestion: exam.marksPerQuestion,
      negativeMarking: exam.negativeMarking,
      enableSecurity: exam.enableSecurity !== false,
      showResultImmediately: exam.showResultImmediately !== false,
      questions: result.answers.map((answer) => {
        const q = questionMap[answer.questionId.toString()];
        if (!q) return null;
        return {
          id: q._id,
          question: q.question,
          options: Array.isArray(answer.options) && answer.options.length > 0 ? answer.options : q.options,
          selectedOption: answer ? answer.selectedOption : null,
        };
      }).filter(Boolean),
    };

    res.json(response);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.submitExam = async (req, res) => {
  try {
    const { resultId, answers, timeTakenMinutes } = req.body;
    const result = await Result.findById(resultId);
    if (!result) return res.status(404).json({ message: "Result not found" });
    if (result.status === "submitted") return res.status(400).json({ message: "Already submitted" });

    const exam = await Exam.findById(result.exam);
    const submittedAnswerMap = {};
    (answers || []).forEach((answer) => {
      submittedAnswerMap[answer.questionId.toString()] = answer.selectedOption;
    });
    const questionIds = result.answers.map((a) => a.questionId);
    const questions = await Question.find({ _id: { $in: questionIds } });
    const questionMap = {};
    questions.forEach((q) => (questionMap[q._id.toString()] = q));

    let totalScore = 0;
    let correctCount = 0;
    let incorrectCount = 0;
    let skippedCount = 0;

    const evaluatedAnswers = result.answers.map((existingAnswer) => {
      const questionId = existingAnswer.questionId.toString();
      const question = questionMap[questionId];
      if (!question) return { ...existingAnswer.toObject(), isCorrect: false, marksObtained: 0 };

      const selectedOption = Object.prototype.hasOwnProperty.call(submittedAnswerMap, questionId)
        ? submittedAnswerMap[questionId]
        : existingAnswer.selectedOption;

      if (selectedOption === null || selectedOption === undefined) {
        skippedCount++;
        return { ...existingAnswer.toObject(), selectedOption, isCorrect: false, marksObtained: 0 };
      }

      const originalOptionIndex = Array.isArray(existingAnswer.optionOrder) && existingAnswer.optionOrder.length > selectedOption
        ? existingAnswer.optionOrder[selectedOption]
        : selectedOption;
      const isCorrect = originalOptionIndex === question.correctAnswer;
      if (isCorrect) {
        correctCount++;
        const marks = exam.marksPerQuestion;
        totalScore += marks;
        return { ...existingAnswer.toObject(), selectedOption, isCorrect: true, marksObtained: marks };
      } else {
        incorrectCount++;
        const penalty = exam.negativeMarking || 0;
        totalScore -= penalty;
        return { ...existingAnswer.toObject(), selectedOption, isCorrect: false, marksObtained: -penalty };
      }
    });

    const percentage = result.totalMarks > 0 ? Math.round((totalScore / result.totalMarks) * 100) : 0;
    const passed = totalScore >= exam.passingMarks;

    result.answers = evaluatedAnswers;
    result.totalScore = Math.max(0, totalScore);
    result.correctCount = correctCount;
    result.incorrectCount = incorrectCount;
    result.skippedCount = skippedCount;
    result.percentage = percentage;
    result.passed = passed;
    result.timeTakenMinutes = timeTakenMinutes || 0;
    result.status = "submitted";
    result.submittedAt = new Date();
    await result.save();

    const showResultImmediately = exam.showResultImmediately !== false;

    res.json({
      submitted: true,
      showResultImmediately,
      totalScore: showResultImmediately ? result.totalScore : undefined,
      totalMarks: showResultImmediately ? result.totalMarks : undefined,
      correctCount: showResultImmediately ? correctCount : undefined,
      incorrectCount: showResultImmediately ? incorrectCount : undefined,
      skippedCount,
      percentage: showResultImmediately ? percentage : undefined,
      passed: showResultImmediately ? passed : undefined,
      message: showResultImmediately
        ? passed
          ? "Congratulations! You passed!"
          : "Sorry, you did not pass. Better luck next time!"
        : "Exam submitted successfully.",
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

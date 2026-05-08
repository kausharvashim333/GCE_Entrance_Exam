const router = require("express").Router();
const { adminOnly, studentOnly } = require("../middleware/auth");
const ctrl = require("../controllers/examController");

router.get("/", adminOnly, ctrl.getExams);
router.post("/", adminOnly, ctrl.createExam);
router.put("/:id", adminOnly, ctrl.updateExam);
router.delete("/:id", adminOnly, ctrl.deleteExam);
router.get("/student", studentOnly, ctrl.getStudentExams);
router.get("/:id/start", studentOnly, ctrl.startExam);
router.post("/submit", studentOnly, ctrl.submitExam);

module.exports = router;

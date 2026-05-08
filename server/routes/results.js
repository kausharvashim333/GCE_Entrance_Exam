const router = require("express").Router();
const { adminOnly, studentOnly } = require("../middleware/auth");
const ctrl = require("../controllers/resultController");

router.get("/", adminOnly, ctrl.getResults);
router.get("/student", studentOnly, ctrl.getStudentResults);
router.get("/:id", ctrl.getResultDetail);
router.get("/stats/:examId", adminOnly, ctrl.getExamStats);
router.delete("/:id", adminOnly, ctrl.deleteResult);

module.exports = router;

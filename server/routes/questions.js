const router = require("express").Router();
const { adminOnly } = require("../middleware/auth");
const ctrl = require("../controllers/questionController");

router.get("/", adminOnly, ctrl.getQuestions);
router.post("/", adminOnly, ctrl.createQuestion);
router.put("/:id", adminOnly, ctrl.updateQuestion);
router.delete("/:id", adminOnly, ctrl.deleteQuestion);
router.post("/bulk", adminOnly, ctrl.bulkImportQuestions);
router.get("/subjects", adminOnly, ctrl.getSubjects);

module.exports = router;

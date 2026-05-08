const router = require("express").Router();
const { adminLogin, studentLogin, getMe } = require("../controllers/authController");
const { auth } = require("../middleware/auth");

router.post("/admin/login", adminLogin);
router.post("/student/login", studentLogin);
router.get("/me", auth, getMe);

module.exports = router;

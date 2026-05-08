const router = require("express").Router();
const { adminOnly } = require("../middleware/auth");
const ctrl = require("../controllers/adminController");

router.get("/branding", ctrl.getBranding);
router.put("/branding", adminOnly, ctrl.updateBranding);
router.get("/dashboard", adminOnly, ctrl.getDashboardStats);
router.get("/students", adminOnly, ctrl.getStudents);
router.post("/students", adminOnly, ctrl.createStudent);
router.put("/students/:id", adminOnly, ctrl.updateStudent);
router.delete("/students/:id", adminOnly, ctrl.deleteStudent);
router.post("/students/bulk", adminOnly, ctrl.bulkImportStudents);
router.get("/batches", adminOnly, ctrl.getBatches);
router.get("/admins", adminOnly, ctrl.getAdmins);
router.post("/admins", adminOnly, ctrl.createAdmin);

module.exports = router;

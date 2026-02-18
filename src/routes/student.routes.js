import express from "express";
import { StudentController } from "../controllers/student.controller.js";
import { verifyToken } from "../middlewares/jwt.middleware.js";
import { verifyAdmin } from "../middlewares/jwt.middleware.js";
import { autoVerifyRole } from "../middlewares/role.middleware.js";

const router = express.Router();

// ============================================
// RUTAS PARA ESTUDIANTES
// ============================================

// Listar estudiantes: admin y docentes pueden ver (docentes ven los de sus secciones)
router.get("/", verifyToken, StudentController.listStudents);
router.get("/search", verifyToken, verifyAdmin, autoVerifyRole, StudentController.searchStudents);
router.get("/:id", verifyToken, verifyAdmin, autoVerifyRole, StudentController.getStudent);
router.post("/", verifyToken, verifyAdmin, autoVerifyRole, StudentController.createStudent);
router.put("/:id", verifyToken, verifyAdmin, autoVerifyRole, StudentController.updateStudent);
router.delete("/:id", verifyToken, verifyAdmin, autoVerifyRole, StudentController.deleteStudent);

// ============================================
// RUTAS PARA INSCRIPCIONES
// ============================================
router.post("/enroll", verifyToken, verifyAdmin, autoVerifyRole, StudentController.enrollStudent);
router.delete("/:studentId/sections/:sectionId", verifyToken, verifyAdmin, autoVerifyRole, StudentController.removeEnrollment);

export default router;
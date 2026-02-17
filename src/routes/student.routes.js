import express from "express";
import { StudentController } from "../controllers/student.controller.js";
import { verifyToken } from "../middlewares/jwt.middleware.js";
import { verifyAdmin } from "../middlewares/jwt.middleware.js";
import { autoVerifyRole } from "../middlewares/role.middleware.js";

const router = express.Router();

// ============================================
// 🟢 PRIMERO: RUTAS ESPECÍFICAS (sin verifyAdmin)
// ============================================

// Ruta para representantes (DEBE IR PRIMERO)
router.get(
  "/mis-estudiantes", 
  verifyToken, 
  autoVerifyRole,
  StudentController.getMyStudents
);

// Ruta para perfil de estudiante para representantes (DEBE IR ANTES DE /:id)
router.get(
  "/:id/representante", 
  verifyToken, 
  autoVerifyRole,
  StudentController.getStudentForRepresentante
);

// Ruta para obtener boletines de un estudiante (para representantes)
router.get(
  "/:id/boletines", 
  verifyToken, 
  autoVerifyRole,
  StudentController.getStudentBoletines
);

// ============================================
// 🔴 DESPUÉS: RUTAS GENÉRICAS (con verifyAdmin)
// ============================================
router.get("/", verifyToken, verifyAdmin, autoVerifyRole, StudentController.listStudents);
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
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

// DESPUÉS (CORRECTO) - DEBE COINCIDIR CON EL PREFIJO DE LAS DEMÁS RUTAS:
router.get('/:id/seccion-actual',  // Cambiado a /:id/seccion-actual para mantener consistencia
  verifyToken,
  autoVerifyRole,
  StudentController.getCurrentSection
);

// Ruta para obtener horarios por grado del estudiante (para representantes)
router.get('/:id/horario-grado',
  verifyToken,
  autoVerifyRole,
  StudentController.getScheduleByGrade
);

// ============================================
// 🔴 DESPUÉS: RUTAS GENÉRICAS (con verifyAdmin)
// ============================================
// Listar estudiantes: admin y docentes pueden ver (docentes ven los de sus secciones)
router.get("/list", verifyToken, autoVerifyRole, StudentController.listStudents);
router.get("/search", verifyToken, autoVerifyRole, StudentController.searchStudents);
router.get("/:id", verifyToken, autoVerifyRole, StudentController.getStudent);
router.post("/", verifyToken, autoVerifyRole, StudentController.createStudent);
router.put("/:id", verifyToken, autoVerifyRole, StudentController.updateStudent);
router.delete("/:id", verifyToken, autoVerifyRole, StudentController.deleteStudent);

// ============================================
// RUTAS PARA INSCRIPCIONES
// ============================================
router.post("/enroll", verifyToken, autoVerifyRole, StudentController.enrollStudent);
router.delete("/:studentId/sections/:sectionId", verifyToken, autoVerifyRole, StudentController.removeEnrollment);

export default router;
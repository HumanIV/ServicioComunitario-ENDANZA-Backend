// routes/grades.routes.js
import { Router } from "express";
import { GradeController } from "../controllers/grade.controller.js";
import { verifyToken } from "../middlewares/jwt.middleware.js";
import { autoVerifyRole } from "../middlewares/role.middleware.js";

const router = Router();

// ============================================
// RUTAS PARA GESTIÓN DE NOTAS
// ============================================

/**
 * Guarda las notas de una sección
 * POST /api/grades
 * Body: { sectionId, grades, academicYearId }
 */
router.post("/grades", 
    verifyToken, 
    autoVerifyRole,
    GradeController.saveGrades
);

/**
 * Obtiene todas las notas de una sección
 * GET /api/grades/section/:sectionId
 */
router.get("/grades/section/:sectionId", 
    verifyToken, 
    autoVerifyRole,
    GradeController.getSectionGrades
);

/**
 * Obtiene los estudiantes de una sección
 * GET /api/sections/:sectionId/students
 */
router.get("/sections/:sectionId/students", 
    verifyToken, 
    autoVerifyRole,
    GradeController.getSectionStudents
);

/**
 * Obtiene la estructura de evaluaciones de una sección
 * GET /api/sections/:sectionId/evaluations
 */
router.get("/sections/:sectionId/evaluations", 
    verifyToken, 
    autoVerifyRole,
    GradeController.getEvaluationStructure
);

/**
 * Obtiene las notas de un estudiante específico
 * GET /api/grades/student/:studentId
 */
router.get("/grades/student/:studentId", 
    verifyToken, 
    autoVerifyRole,
    GradeController.getStudentGrades
);

/**
 * Exporta las notas de una sección (para reportes)
 * GET /api/grades/section/:sectionId/export
 */
router.get("/grades/section/:sectionId/export", 
    verifyToken, 
    autoVerifyRole,
    GradeController.exportSectionGrades
);

export default router;
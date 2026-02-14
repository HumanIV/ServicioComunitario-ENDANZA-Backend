// routes/teacher.routes.js
import { Router } from "express";
import { TeacherController } from "../controllers/teacher.controller.js";
import { verifyToken } from "../middlewares/jwt.middleware.js";
import { verifyRole, autoVerifyRole } from "../middlewares/role.middleware.js";

const router = Router();

// ============================================
// RUTAS PÚBLICAS DEL SISTEMA (con autoVerifyRole)
// ============================================
router.get("/list", 
    verifyToken, 
    autoVerifyRole,
    TeacherController.listTeachers
);

// Listar docentes filtrados por año académico
router.get("/list/year/:academicYearId", 
    verifyToken, 
    autoVerifyRole,
    TeacherController.listTeachersByYear
);

router.get("/catalog/specialties", 
    verifyToken, 
    autoVerifyRole,
    TeacherController.listSpecialties
);

router.get("/catalog/grades", 
    verifyToken, 
    autoVerifyRole,
    TeacherController.listGrades
);

router.get("/:id", 
    verifyToken, 
    autoVerifyRole,
    TeacherController.getTeacherById
);

// Obtener docente con asignaciones de un año específico
router.get("/:userId/year/:academicYearId", 
    verifyToken, 
    autoVerifyRole,
    TeacherController.getTeacherWithYear
);

// Obtener grados de un docente para un año específico
router.get("/:userId/grades/year/:academicYearId", 
    verifyToken, 
    autoVerifyRole,
    TeacherController.getTeacherGradesByYear
);

// ============================================
// RUTAS DE ADMINISTRACIÓN (solo admin)
// ============================================
router.put("/:id/specialty", 
    verifyToken, 
    verifyRole(['admin']),
    TeacherController.assignSpecialty
);

// NUEVA RUTA: Asignar especialidad con año académico
router.put("/:id/specialty/year", 
    verifyToken, 
    verifyRole(['admin']),
    TeacherController.assignSpecialtyByYear
);

// Asignar grados con año académico (año en body)
router.put("/:id/grades", 
    verifyToken, 
    verifyRole(['admin']),
    TeacherController.assignGrades
);

// Asignar grados con año en URL
router.post("/:userId/grades/year/:academicYearId", 
    verifyToken, 
    verifyRole(['admin']),
    TeacherController.assignGradesWithYear
);

// Copiar asignaciones de un año a otro
router.post("/copy-assignments/:fromYearId/:toYearId", 
    verifyToken, 
    verifyRole(['admin']),
    TeacherController.copyAssignments
);

router.put("/:id", 
    verifyToken, 
    verifyRole(['admin']),
    TeacherController.updateTeacher
);

router.delete("/:id", 
    verifyToken, 
    verifyRole(['admin']),
    TeacherController.deleteTeacher
);

// ============================================
// RUTAS ESPECÍFICAS PARA DOCENTES
// ============================================
router.get("/:id/my-schedule", 
    verifyToken, 
    verifyRole(['admin', 'docente']),
    TeacherController.getMySchedule
);

router.get("/:id/my-students", 
    verifyToken, 
    verifyRole(['docente']),
    TeacherController.getMyStudents
);

export default router;
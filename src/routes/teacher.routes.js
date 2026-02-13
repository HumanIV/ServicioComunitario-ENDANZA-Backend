// routes/teacher.routes.js
import { Router } from "express";
import { TeacherController } from "../controllers/teacher.controller.js";
import { verifyToken } from "../middlewares/jwt.middleware.js";
import { verifyRole, autoVerifyRole } from "../middlewares/role.middleware.js";

const router = Router();

// ============================================
// RUTAS PÚBLICAS DEL SISTEMA (con autoVerifyRole)
// Cualquier usuario autenticado puede ver listados básicos
// ============================================
router.get("/list", 
    verifyToken, 
    autoVerifyRole,  // ✅ Usa tu middleware existente
    TeacherController.listTeachers
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

// ============================================
// RUTAS DE ADMINISTRACIÓN (solo admin)
// Usando verifyRole explícito para máxima seguridad
// ============================================
router.put("/:id/specialty", 
    verifyToken, 
    verifyRole(['admin']),  // ✅ Solo admin
    TeacherController.assignSpecialty
);

router.put("/:id/grades", 
    verifyToken, 
    verifyRole(['admin']),  // ✅ Solo admin
    TeacherController.assignGrades
);

router.put("/:id", 
    verifyToken, 
    verifyRole(['admin']),  // ✅ Solo admin
    TeacherController.updateTeacher
);

router.delete("/:id", 
    verifyToken, 
    verifyRole(['admin']),  // ✅ Solo admin
    TeacherController.deleteTeacher
);

// ============================================
// RUTAS ESPECÍFICAS PARA DOCENTES
// Solo los propios docentes pueden ver su información detallada
// ============================================
router.get("/:id/my-schedule", 
    verifyToken, 
    verifyRole(['admin', 'docente']),  // ✅ Admin y docente
    TeacherController.getMySchedule
);

router.get("/:id/my-students", 
    verifyToken, 
    verifyRole(['docente']),  // ✅ Solo docente
    TeacherController.getMyStudents
);

export default router;
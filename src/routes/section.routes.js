// routes/sections.routes.js - VERSIÓN COMPLETA
import { Router } from "express";
import { SectionController } from "../controllers/section.controller.js";
import { verifyToken } from "../middlewares/jwt.middleware.js";
import { autoVerifyRole } from "../middlewares/role.middleware.js";

const router = Router();

// ============================================
// RUTAS EXISTENTES DE SECCIONES
// ============================================
router.get("/sections",
    verifyToken,
    autoVerifyRole,
    SectionController.listSections
);

router.get("/sections/:id",
    verifyToken,
    autoVerifyRole,
    SectionController.getSection
);

router.post("/sections",
    verifyToken,
    autoVerifyRole,
    SectionController.createSection
);

router.put("/sections/:id",
    verifyToken,
    autoVerifyRole,
    SectionController.updateSection
);

router.delete("/sections/:id",
    verifyToken,
    autoVerifyRole,
    SectionController.deleteSection
);

// ============================================
// 🆕 NUEVAS RUTAS PARA EL MÓDULO DE NOTAS
// ============================================

/**
 * Obtiene los estudiantes de una sección específica
 * Útil para cargar la lista de estudiantes en el módulo de notas
 */
router.get("/sections/:sectionId/students",
    verifyToken,
    autoVerifyRole,
    SectionController.getSectionStudents
);

/**
 * Obtiene la estructura de evaluaciones de una sección
 * Define cuántas evaluaciones tiene la materia y sus pesos
 */
router.get("/sections/:sectionId/evaluations",
    verifyToken,
    autoVerifyRole,
    SectionController.getEvaluationStructure
);



export default router;
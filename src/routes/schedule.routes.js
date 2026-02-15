// routes/schedule.routes.js
import { Router } from "express";
import { ScheduleController } from "../controllers/schedule.controller.js";
import { verifyToken } from "../middlewares/jwt.middleware.js";
import { autoVerifyRole } from "../middlewares/role.middleware.js"; // ← Solo autoVerifyRole

const router = Router();

// ============================================
// TODAS LAS RUTAS USAN EL MISMO PATRÓN
// ============================================

// Catálogos
router.get("/classrooms", 
    verifyToken, 
    autoVerifyRole,
    ScheduleController.listClassrooms
);

router.get("/days", 
    verifyToken, 
    autoVerifyRole,
    ScheduleController.listDays
);

router.get("/blocks", 
    verifyToken, 
    autoVerifyRole,
    ScheduleController.listBlocks
);

// Secciones - TODAS con autoVerifyRole
router.get("/sections", 
    verifyToken, 
    autoVerifyRole,
    ScheduleController.listSections
);

router.get("/sections/:id", 
    verifyToken, 
    autoVerifyRole,
    ScheduleController.getSection
);

router.post("/sections", 
    verifyToken, 
    autoVerifyRole,  // ← CAMBIADO de verifyRole a autoVerifyRole
    ScheduleController.createSection
);

router.put("/sections/:id", 
    verifyToken, 
    autoVerifyRole,  // ← CAMBIADO
    ScheduleController.updateSection
);

router.delete("/sections/:id", 
    verifyToken, 
    autoVerifyRole,  // ← CAMBIADO
    ScheduleController.deleteSection
);

// Horarios
router.get("/schedules", 
    verifyToken, 
    autoVerifyRole,
    ScheduleController.listSchedules
);

router.post("/sections/:sectionId/schedules", 
    verifyToken, 
    autoVerifyRole,  // ← CAMBIADO
    ScheduleController.createSchedule
);

router.put("/schedules/:scheduleId", 
    verifyToken, 
    autoVerifyRole,  // ← CAMBIADO
    ScheduleController.updateSchedule
);

router.delete("/schedules/:scheduleId", 
    verifyToken, 
    autoVerifyRole,  // ← CAMBIADO
    ScheduleController.deleteSchedule
);

// Verificar disponibilidad
router.get("/schedules/check-availability", 
    verifyToken, 
    autoVerifyRole,
    ScheduleController.checkAvailability
);

export default router;
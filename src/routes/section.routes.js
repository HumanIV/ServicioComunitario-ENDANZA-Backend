import express from "express";
import { SectionController } from "../controllers/section.controller.js";
import { verifyToken } from "../middlewares/jwt.middleware.js";
import { verifyAdmin } from "../middlewares/jwt.middleware.js";
import { autoVerifyRole } from "../middlewares/role.middleware.js";

const router = express.Router();

// ============================================
// RUTAS PARA SECCIONES
// ============================================

// Todas las rutas requieren autenticación y rol de admin/superroot
router.get("/", verifyToken, verifyAdmin, autoVerifyRole, SectionController.listSections);
router.get("/check-availability", verifyToken, verifyAdmin, autoVerifyRole, SectionController.checkAvailability);
router.get("/:id", verifyToken, verifyAdmin, autoVerifyRole, SectionController.getSection);
router.post("/", verifyToken, verifyAdmin, autoVerifyRole, SectionController.createSection);
router.put("/:id", verifyToken, verifyAdmin, autoVerifyRole, SectionController.updateSection);
router.delete("/:id", verifyToken, verifyAdmin, autoVerifyRole, SectionController.deleteSection);

// ============================================
// RUTAS PARA HORARIOS DENTRO DE SECCIONES
// ============================================
router.post("/:sectionId/schedules", verifyToken, verifyAdmin, autoVerifyRole, SectionController.addSchedule);
router.delete("/schedules/:scheduleId", verifyToken, verifyAdmin, autoVerifyRole, SectionController.removeSchedule);

export default router;
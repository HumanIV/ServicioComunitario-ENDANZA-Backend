import express from "express";
import { ConfigController } from "../controllers/config.controller.js";
import { verifyToken } from "../middlewares/jwt.middleware.js";
import { verifyAdmin } from "../middlewares/jwt.middleware.js";
import { autoVerifyRole } from "../middlewares/role.middleware.js";

const router = express.Router();

// ============================================
// RUTAS PÚBLICAS (sin verifyAdmin, accesibles para docentes y representantes)
// ============================================
router.get(
  "/academic-years/active/public",
  verifyToken,
  autoVerifyRole,
  ConfigController.getActiveAcademicYearPublic
);

router.get(
  "/enrollment-period/:yearId/public",
  verifyToken,
  autoVerifyRole,
  ConfigController.getEnrollmentPeriodPublic
);

// ============================================
// RUTAS PARA AÑOS ACADÉMICOS
// ============================================
router.get(
  "/academic-years",
  verifyToken,
  autoVerifyRole,
  ConfigController.getAcademicYears
);

router.get(
  "/academic-years/active",
  verifyToken,
  autoVerifyRole,
  ConfigController.getActiveAcademicYear
);

router.post(
  "/academic-years",
  verifyToken,
  verifyAdmin,
  autoVerifyRole,
  ConfigController.createAcademicYear
);

// ============================================
// RUTAS PARA LAPSOS
// ============================================
router.get(
  "/academic-years/:yearId/lapsos",
  verifyToken,
  autoVerifyRole,
  ConfigController.getLapsosByYear
);

// ============================================
// RUTAS PARA PERÍODO DE INSCRIPCIÓN
// ============================================
router.get(
  "/enrollment-period/:yearId",
  verifyToken,
  verifyAdmin,
  autoVerifyRole,
  ConfigController.getEnrollmentPeriod
);

router.put(
  "/enrollment-period/:yearId",
  verifyToken,
  verifyAdmin,
  autoVerifyRole,
  ConfigController.updateEnrollmentPeriod
);

// ============================================
// RUTAS PARA PERÍODO DE SUBIDA DE NOTAS
// ============================================
router.get(
  "/grades-period/:yearId",
  verifyToken,
  autoVerifyRole,
  ConfigController.getGradesPeriod
);

router.put(
  "/grades-period/:yearId",
  verifyToken,
  verifyAdmin,
  autoVerifyRole,
  ConfigController.updateGradesPeriod
);

export default router;
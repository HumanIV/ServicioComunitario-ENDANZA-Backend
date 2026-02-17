import express from "express";
import { ConfigController } from "../controllers/config.controller.js";
import { verifyToken } from "../middlewares/jwt.middleware.js";
import { verifyAdmin } from "../middlewares/jwt.middleware.js"; // Reutilizamos verifyAdmin para SuperRoot
import { autoVerifyRole } from "../middlewares/role.middleware.js";

const router = express.Router();

// ============================================
// MIDDLEWARE ESPECÍFICO PARA SUPERROOT
// ============================================
// Como SuperRoot es básicamente un Admin con más poder,
// usamos verifyAdmin que verifica Id_rol === 1



// ============================================
// RUTA PÚBLICA PARA AÑO ACTIVO (sin verifyAdmin)
// ============================================
router.get(
  "/academic-years/active/public", 
  verifyToken, 
  autoVerifyRole,  // 👈 SIN verifyAdmin
  ConfigController.getActiveAcademicYearPublic
);

// ============================================
// RUTA PÚBLICA PARA PERÍODO DE INSCRIPCIÓN (sin verifyAdmin)
// ============================================
router.get(
  "/enrollment-period/:yearId/public",  // 👈 NUEVA RUTA PÚBLICA
  verifyToken, 
  autoVerifyRole,  // 👈 SIN verifyAdmin
  ConfigController.getEnrollmentPeriodPublic
);



// ============================================
// RUTA PÚBLICA PARA AÑO ACTIVO (sin verifyAdmin)
// ============================================
router.get(
  "/academic-years/active/public", 
  verifyToken, 
  autoVerifyRole,  // 👈 SIN verifyAdmin
  ConfigController.getActiveAcademicYearPublic
);

// ============================================
// RUTAS PARA AÑOS ACADÉMICOS
// ============================================
router.get(
  "/academic-years", 
  verifyToken, 
  verifyAdmin, 
  autoVerifyRole, 
  ConfigController.getAcademicYears
);

router.get(
  "/academic-years/active", 
  verifyToken, 
  verifyAdmin, 
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
  verifyAdmin, 
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
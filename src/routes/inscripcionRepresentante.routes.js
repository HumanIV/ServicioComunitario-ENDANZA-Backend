import express from "express";
import { InscripcionRepresentanteController } from '../controllers/inscripcionRepresentante.controller.js'; // ✅ CON .js
import { verifyToken } from '../middlewares/jwt.middleware.js'; // ✅ CON .js
import { autoVerifyRole } from '../middlewares/role.middleware.js'; // ✅ CON .js
const router = express.Router();

// ============================================
// RUTAS PARA INSCRIPCIÓN DE REPRESENTANTES
// ============================================

// Completar inscripción de un estudiante (representante autenticado)
router.post(
  "/completar",
  verifyToken,
  autoVerifyRole,
  InscripcionRepresentanteController.completarInscripcion
);

// Verificar si un estudiante ya está inscrito
router.get(
  "/verificar/:studentId",
  verifyToken,
  autoVerifyRole,
  InscripcionRepresentanteController.verificarInscripcion
);

export default router;
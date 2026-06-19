// backend/routes/representante.routes.js - MODIFICADO

import express from "express";
import { RepresentanteController } from "../controllers/representante.controller.js";
import { verifyToken, verifyAdmin } from "../middlewares/jwt.middleware.js";
import { autoVerifyRole } from "../middlewares/role.middleware.js";

const router = express.Router();

// ============================================
// RUTAS PARA REPRESENTANTES
// ============================================


// Preinscripción (público para nuevos registros)
router.post(
  "/preinscripcion",
  RepresentanteController.createFromPreinscripcion
);

// Listar TODOS los representantes (NUEVO)
router.get(
  "/list",
  verifyToken,
  autoVerifyRole,
  RepresentanteController.listRepresentantes
);

// Buscar representantes por término (público para autocompletado en preinscripción)
router.get(
  "/search",
  RepresentanteController.searchRepresentantes
);

// Obtener representante con sus estudiantes
router.get(
  "/:id/estudiantes",
  verifyToken,
  autoVerifyRole,
  RepresentanteController.getRepresentanteConEstudiantes
);

export default router;
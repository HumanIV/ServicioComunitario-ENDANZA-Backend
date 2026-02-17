// Archivo: backend/routes/nota.routes.js
import express from "express";
import { NotaController } from "../controllers/nota.controller.js";
import { verifyToken } from "../middlewares/jwt.middleware.js";
import { verifyAdmin } from "../middlewares/jwt.middleware.js";
import { autoVerifyRole } from "../middlewares/role.middleware.js";

const router = express.Router();

router.get("/pendientes", verifyToken, verifyAdmin, autoVerifyRole, NotaController.getPendientes);
router.put("/:id/aprobar", verifyToken, verifyAdmin, autoVerifyRole, NotaController.aprobarNota);
router.put("/:id/rechazar", verifyToken, verifyAdmin, autoVerifyRole, NotaController.rechazarNota);
router.post("/aprobar-todas", verifyToken, verifyAdmin, autoVerifyRole, NotaController.aprobarTodas);
router.get("/verificar-pendientes", verifyToken, verifyAdmin, autoVerifyRole, NotaController.verificarPendientes);

// Rutas para Docentes
router.get("/docente/carga-academica", verifyToken, autoVerifyRole, NotaController.getTeacherAllocations);
router.get("/docente/estudiantes/:sectionId", verifyToken, autoVerifyRole, NotaController.getSectionStudents);
router.post("/docente/guardar-competencia", verifyToken, autoVerifyRole, NotaController.saveCompetenciaGrade);
router.post("/docente/guardar-lote", verifyToken, autoVerifyRole, NotaController.saveGradesBatch);

export default router;
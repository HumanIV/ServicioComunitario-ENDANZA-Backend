// Archivo: backend/routes/boletin.routes.js
import express from "express";
import { BoletinController } from "../controllers/boletin.controller.js";
import { verifyToken } from "../middlewares/jwt.middleware.js";
import { verifyAdmin } from "../middlewares/jwt.middleware.js";
import { autoVerifyRole } from "../middlewares/role.middleware.js";

const router = express.Router();

router.get("/", verifyToken, verifyAdmin, autoVerifyRole, BoletinController.getBoletines);
router.put("/:id", verifyToken, verifyAdmin, autoVerifyRole, BoletinController.updateBoletin);
// Generar boletines para estudiantes
router.post("/generar", verifyToken, verifyAdmin, autoVerifyRole, BoletinController.generarBoletines);

router.post("/habilitar-todos", verifyToken, verifyAdmin, autoVerifyRole, BoletinController.habilitarTodos);

export default router;
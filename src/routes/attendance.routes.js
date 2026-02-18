
import { Router } from 'express';
import { saveAttendance, getStudentHistory, getSectionAttendance } from '../controllers/attendance.controller.js';
import { verifyToken } from '../middlewares/jwt.middleware.js';

const router = Router();

// Endpoint para guardar asistencia (batch)
router.post('/', verifyToken, saveAttendance);

// Endpoint para obtener historial de un estudiante
router.get('/student/:studentId', verifyToken, getStudentHistory);

// Endpoint para obtener asistencia de una sección (opcionalmente en una fecha)
router.get('/section/:sectionId', verifyToken, getSectionAttendance);

export default router;

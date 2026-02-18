
import { AttendanceModel } from '../models/attendance.model.js';

export const saveAttendance = async (req, res) => {
    /* 
        Body esperado:
        {
            sectionId: 123,
            date: '2026-02-18',
            attendance: [
                { studentId: 1, status: 'presente' },
                { studentId: 2, status: 'ausente' }
            ]
        }
    */
    try {
        const { sectionId, date, attendance } = req.body;

        if (!sectionId || !date || !attendance || !attendance.length) {
            return res.status(400).json({ ok: false, msg: 'Datos incompletos' });
        }

        // Transformar al formato que espera el modelo
        const records = attendance.map(record => ({
            studentId: record.studentId,
            status: record.status,
            date: date,
            sectionId: sectionId,
            isJustified: record.isJustified || false,
            justification: record.justification || ''
        }));

        const results = await AttendanceModel.createBatch(records);

        return res.json({
            ok: true,
            msg: `Asistencia guardada para ${results.length} estudiantes`,
            data: results
        });

    } catch (error) {
        console.error("Error en saveAttendance:", error);
        return res.status(500).json({ ok: false, msg: 'Error al guardar asistencia' });
    }
};

export const getStudentHistory = async (req, res) => {
    try {
        const { studentId, sectionId } = req.params;
        const history = await AttendanceModel.findByStudentId(studentId);

        // Si queremos filtrar por sección, podemos hacerlo aquí o en el modelo
        let filteredHistory = history;
        if (sectionId) {
            filteredHistory = history.filter(h => h.sectionId == sectionId);
        }

        return res.json({
            ok: true,
            data: filteredHistory
        });
    } catch (error) {
        console.error("Error en getStudentHistory:", error);
        return res.status(500).json({ ok: false, msg: 'Error al obtener historial' });
    }
};

export const getSectionAttendance = async (req, res) => {
    try {
        const { sectionId } = req.params;
        const { date } = req.query;

        const attendance = await AttendanceModel.findBySectionId(sectionId, date);

        return res.json({
            ok: true,
            data: attendance
        });
    } catch (error) {
        console.error("Error en getSectionAttendance:", error);
        return res.status(500).json({ ok: false, msg: 'Error al obtener asistencia de sección' });
    }
};

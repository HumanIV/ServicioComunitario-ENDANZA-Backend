
import { db } from "../db/connection.database.js";

const create = async (attendanceData) => {
    try {
        const query = {
            text: `
                INSERT INTO "Asistencia" (fecha_asistencia, estatus, esta_justificada, "Id_estudiante", "Id_seccion")
                VALUES ($1, $2, $3, $4, $5)
                RETURNING *
            `,
            values: [
                attendanceData.date,
                attendanceData.status,
                attendanceData.isJustified || false,
                attendanceData.studentId,
                attendanceData.sectionId
            ]
        };
        const { rows } = await db.query(query.text, query.values);
        return rows[0];
    } catch (error) {
        console.error("Error en AttendanceModel.create:", error);
        throw error;
    }
};

const createBatch = async (records) => {
    // records: array de { studentId, status, date, sectionId }
    try {
        // En un caso real usaríamos una transacción, pero por simplicidad haremos un loop
        // Ojo: Esto no es lo más eficiente para lotes grandes, pero sirve para este caso de uso.
        const results = [];
        for (const record of records) {
            // Verificar si ya existe registro para ese estudiante, sección y fecha
            // Si existe, actualizamos. Si no, insertamos. (Upsert manual)

            const existing = await findByStudentSectionDate(record.studentId, record.sectionId, record.date);

            let result;
            if (existing) {
                // Actualizar
                const updateQuery = {
                    text: `
                        UPDATE "Asistencia" 
                        SET estatus = $1, esta_justificada = $2, descripcion_justificacion = $3 
                        WHERE "Id_asistencia" = $4
                        RETURNING *
                   `,
                    values: [
                        record.status,
                        record.isJustified || false,
                        record.justification || null,
                        existing.Id_asistencia
                    ]
                };
                const { rows } = await db.query(updateQuery.text, updateQuery.values);
                result = rows[0];
            } else {
                // Crear
                const insertQuery = {
                    text: `
                        INSERT INTO "Asistencia" (fecha_asistencia, estatus, esta_justificada, descripcion_justificacion, "Id_estudiante", "Id_seccion")
                        VALUES ($1, $2, $3, $4, $5, $6)
                        RETURNING *
                    `,
                    values: [
                        record.date,
                        record.status,
                        record.isJustified || false,
                        record.justification || null,
                        record.studentId,
                        record.sectionId
                    ]
                };
                const { rows } = await db.query(insertQuery.text, insertQuery.values);
                result = rows[0];
            }
            results.push(result);
        }
        return results;
    } catch (error) {
        console.error("Error en AttendanceModel.createBatch:", error);
        throw error;
    }
};

const findByStudentId = async (studentId) => {
    try {
        const query = {
            text: `
                SELECT 
                    a."Id_asistencia" as id, 
                    a.fecha_asistencia as date, 
                    a.estatus as status, 
                    a.esta_justificada as is_justified,
                    a.descripcion_justificacion as justification,
                    s.nombre_seccion as section_name
                FROM "Asistencia" a
                LEFT JOIN "Seccion" s ON a."Id_seccion" = s."Id_seccion"
                WHERE a."Id_estudiante" = $1
                ORDER BY a.fecha_asistencia DESC
            `,
            values: [studentId]
        };
        const { rows } = await db.query(query.text, query.values);
        return rows;
    } catch (error) {
        console.error("Error en AttendanceModel.findByStudentId:", error);
        throw error;
    }
};

const findBySectionId = async (sectionId, date = null) => {
    try {
        let queryText = `
            SELECT 
                a."Id_asistencia" as id, 
                a.fecha_asistencia as date, 
                a.estatus as status, 
                a.esta_justificada as is_justified,
                a."Id_estudiante" as student_id
            FROM "Asistencia" a
            WHERE a."Id_seccion" = $1
        `;
        const values = [sectionId];

        if (date) {
            queryText += ` AND a.fecha_asistencia = $2`;
            values.push(date);
        }

        const { rows } = await db.query(queryText, values);
        return rows;
    } catch (error) {
        console.error("Error en AttendanceModel.findBySectionId:", error);
        throw error;
    }
};

const findByStudentSectionDate = async (studentId, sectionId, date) => {
    try {
        const query = {
            text: `
                SELECT * FROM "Asistencia" 
                WHERE "Id_estudiante" = $1 AND "Id_seccion" = $2 AND fecha_asistencia = $3
            `,
            values: [studentId, sectionId, date]
        };
        const { rows } = await db.query(query.text, query.values);
        return rows[0];
    } catch (error) {
        return null;
    }
}

export const AttendanceModel = {
    create,
    createBatch,
    findByStudentId,
    findBySectionId
};

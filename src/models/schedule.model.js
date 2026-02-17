// models/schedule.model.js - VERSIÓN COMPLETA CORREGIDA CON NIVEL ACADÉMICO
import { db } from "../db/connection.database.js";

// ============================================
// SECCIONES - CON NIVEL ACADÉMICO
// ============================================

const findAllSections = async (academicYearId = null) => {
    try {
        let query;

        if (academicYearId) {
            query = {
                text: `
                    SELECT 
                        s."Id_seccion" as id,
                        s."nombre_seccion" as section_name,
                        'General' as grade_level,
                        s."capacidad" as capacity,
                        s."Id_materia" as subject_id,
                        s."Id_lapso" as period_id,
                        s."Id_ano" as academic_year_id,
                        COALESCE(m."nombre_materia", 'Sin materia') as subject_name,
                        COALESCE(l."nombre_lapso", 'Período 1') as period_name,
                        a."nombre_ano" as academic_year_name,
                        -- Horarios de la sección CON MATERIAS
                        COALESCE(
                            (
                                SELECT json_agg(
                                    json_build_object(
                                        'id', h."Id_horario",
                                        'day_id', h."Id_dia",
                                        'day_name', d."nombre_dia",
                                        'block_id', h."Id_bloque",
                                        'block_name', b."nombre_bloque",
                                        'start_time', b."inicio_bloque",
                                        'end_time', b."fin_bloque",
                                        'classroom_id', h."Id_aula",
                                        'classroom_name', au."nombre_aula",
                                        'teacher_id', h."Id_profesor",
                                        'teacher_name', CONCAT(u."nombre", ' ', u."apellido"),
                                        'teacher_user_id', u."Id_usuario"
                                    )
                                    ORDER BY d."Id_dia", b."inicio_bloque"
                                )
                                FROM "Horario" h
                                LEFT JOIN "Dia" d ON h."Id_dia" = d."Id_dia"
                                LEFT JOIN "Bloque_Horario" b ON h."Id_bloque" = b."Id_bloque"
                                LEFT JOIN "Aula" au ON h."Id_aula" = au."Id_aula"
                                LEFT JOIN "Profesor" p ON h."Id_profesor" = p."Id_profesor"
                                LEFT JOIN "Usuario" u ON p."Id_usuario" = u."Id_usuario"
                                WHERE h."Id_seccion" = s."Id_seccion"
                            ),
                            '[]'::json
                        ) as schedules,
                        -- Calcular horas totales
                        COALESCE(
                            (
                                SELECT SUM(EXTRACT(EPOCH FROM (b."fin_bloque" - b."inicio_bloque")) / 3600)
                                FROM "Horario" h
                                JOIN "Bloque_Horario" b ON h."Id_bloque" = b."Id_bloque"
                                WHERE h."Id_seccion" = s."Id_seccion"
                            ),
                            0
                        ) as total_hours
                    FROM "Seccion" s
                    LEFT JOIN "Materia" m ON s."Id_materia" = m."Id_materia"
                    LEFT JOIN "Lapso" l ON s."Id_lapso" = l."Id_lapso"
                    LEFT JOIN "Ano_Academico" a ON s."Id_ano" = a."Id_ano"
                    WHERE s."Id_ano" = $1
                    ORDER BY s."Id_seccion" DESC
                `,
                values: [academicYearId]
            };
        } else {
            query = {
                text: `
                    SELECT 
                        s."Id_seccion" as id,
                        s."nombre_seccion" as section_name,
                        'General' as grade_level,
                        s."capacidad" as capacity,
                        s."Id_materia" as subject_id,
                        s."Id_lapso" as period_id,
                        s."Id_ano" as academic_year_id,
                        COALESCE(m."nombre_materia", 'Sin materia') as subject_name,
                        COALESCE(l."nombre_lapso", 'Período 1') as period_name,
                        a."nombre_ano" as academic_year_name,
                        -- Horarios de la sección CON MATERIAS
                        COALESCE(
                            (
                                SELECT json_agg(
                                    json_build_object(
                                        'id', h."Id_horario",
                                        'day_id', h."Id_dia",
                                        'day_name', d."nombre_dia",
                                        'block_id', h."Id_bloque",
                                        'block_name', b."nombre_bloque",
                                        'start_time', b."inicio_bloque",
                                        'end_time', b."fin_bloque",
                                        'classroom_id', h."Id_aula",
                                        'classroom_name', au."nombre_aula",
                                        'teacher_id', h."Id_profesor",
                                        'teacher_name', CONCAT(u."nombre", ' ', u."apellido"),
                                        'teacher_user_id', u."Id_usuario"
                                    )
                                    ORDER BY d."Id_dia", b."inicio_bloque"
                                )
                                FROM "Horario" h
                                LEFT JOIN "Dia" d ON h."Id_dia" = d."Id_dia"
                                LEFT JOIN "Bloque_Horario" b ON h."Id_bloque" = b."Id_bloque"
                                LEFT JOIN "Aula" au ON h."Id_aula" = au."Id_aula"
                                LEFT JOIN "Profesor" p ON h."Id_profesor" = p."Id_profesor"
                                LEFT JOIN "Usuario" u ON p."Id_usuario" = u."Id_usuario"
                                WHERE h."Id_seccion" = s."Id_seccion"
                            ),
                            '[]'::json
                        ) as schedules,
                        -- Calcular horas totales
                        COALESCE(
                            (
                                SELECT SUM(EXTRACT(EPOCH FROM (b."fin_bloque" - b."inicio_bloque")) / 3600)
                                FROM "Horario" h
                                JOIN "Bloque_Horario" b ON h."Id_bloque" = b."Id_bloque"
                                WHERE h."Id_seccion" = s."Id_seccion"
                            ),
                            0
                        ) as total_hours
                    FROM "Seccion" s
                    LEFT JOIN "Materia" m ON s."Id_materia" = m."Id_materia"
                    LEFT JOIN "Lapso" l ON s."Id_lapso" = l."Id_lapso"
                    LEFT JOIN "Ano_Academico" a ON s."Id_ano" = a."Id_ano"
                    ORDER BY s."Id_seccion" DESC
                `
            };
        }

        const { rows } = await db.query(query.text, query.values || []);
        console.log(`📋 Encontradas ${rows.length} secciones para año ${academicYearId || 'todos'}`);
        return rows;
    } catch (error) {
        console.error("❌ Error en schedule.findAllSections:", error);
        throw error;
    }
};

const findSectionById = async (id) => {
    try {
        const query = {
            text: `
                SELECT 
                    s."Id_seccion" as id,
                    s."nombre_seccion" as section_name,
                    'General' as grade_level,
                    s."capacidad" as capacity,
                    s."Id_materia" as subject_id,
                    s."Id_lapso" as period_id,
                    s."Id_ano" as academic_year_id,
                    COALESCE(m."nombre_materia", 'Sin materia') as subject_name,
                    COALESCE(l."nombre_lapso", 'Período 1') as period_name,
                    a."nombre_ano" as academic_year_name,
                    -- Horarios de la sección CON MATERIAS
                    COALESCE(
                        (
                            SELECT json_agg(
                                json_build_object(
                                    'id', h."Id_horario",
                                    'day_id', h."Id_dia",
                                    'day_name', d."nombre_dia",
                                    'block_id', h."Id_bloque",
                                    'block_name', b."nombre_bloque",
                                    'start_time', b."inicio_bloque",
                                    'end_time', b."fin_bloque",
                                    'classroom_id', h."Id_aula",
                                    'classroom_name', au."nombre_aula",
                                    'teacher_id', h."Id_profesor",
                                    'teacher_name', CONCAT(u."nombre", ' ', u."apellido"),
                                    'teacher_user_id', u."Id_usuario"
                                )
                                ORDER BY d."Id_dia", b."inicio_bloque"
                            )
                            FROM "Horario" h
                            LEFT JOIN "Dia" d ON h."Id_dia" = d."Id_dia"
                            LEFT JOIN "Bloque_Horario" b ON h."Id_bloque" = b."Id_bloque"
                            LEFT JOIN "Aula" au ON h."Id_aula" = au."Id_aula"
                            LEFT JOIN "Profesor" p ON h."Id_profesor" = p."Id_profesor"
                            LEFT JOIN "Usuario" u ON p."Id_usuario" = u."Id_usuario"
                            WHERE h."Id_seccion" = s."Id_seccion"
                        ),
                        '[]'::json
                    ) as schedules,
                    -- Calcular horas totales
                    COALESCE(
                        (
                            SELECT SUM(EXTRACT(EPOCH FROM (b."fin_bloque" - b."inicio_bloque")) / 3600)
                            FROM "Horario" h
                            JOIN "Bloque_Horario" b ON h."Id_bloque" = b."Id_bloque"
                            WHERE h."Id_seccion" = s."Id_seccion"
                        ),
                        0
                    ) as total_hours
                FROM "Seccion" s
                LEFT JOIN "Materia" m ON s."Id_materia" = m."Id_materia"
                LEFT JOIN "Lapso" l ON s."Id_lapso" = l."Id_lapso"
                LEFT JOIN "Ano_Academico" a ON s."Id_ano" = a."Id_ano"
                WHERE s."Id_seccion" = $1
            `,
            values: [id]
        };

        const { rows } = await db.query(query.text, query.values);
        return rows[0];
    } catch (error) {
        console.error("❌ Error en schedule.findSectionById:", error);
        throw error;
    }
};

// ============================================
// CREAR SECCIÓN - CON NIVEL ACADÉMICO
// ============================================
// En models/schedule.model.js - createSection
const createSection = async (sectionData) => {
    try {
        const { section_name, grade_level, capacity, subject_id, academic_year_id } = sectionData;

        console.log('📥 MODEL - Datos recibidos en modelo:', {
            section_name,
            grade_level,  // ← DEBE APARECER AQUÍ
            capacity,
            subject_id,
            academic_year_id
        });

        let finalYearId = academic_year_id;

        if (!finalYearId) {
            console.log('⚠️ No se recibió academic_year_id, buscando año activo...');
            const yearResult = await db.query(
                'SELECT "Id_ano" FROM "Ano_Academico" WHERE "activo" = true LIMIT 1'
            );
            finalYearId = yearResult.rows[0]?.Id_ano;
        }

        if (!finalYearId) {
            throw new Error('No se pudo determinar un año académico válido');
        }

        console.log('✅ Año determinado:', finalYearId);

        const lapsoResult = await db.query(
            'SELECT "Id_lapso" FROM "Lapso" WHERE "Id_ano" = $1 LIMIT 1',
            [finalYearId]
        );
        const lapsoId = lapsoResult.rows[0]?.Id_lapso || null;

        console.log('📅 Lapso asociado:', lapsoId);

        const query = {
            text: `
                INSERT INTO "Seccion" (
                    "nombre_seccion", 
                    "capacidad", 
                    "Id_materia", 
                    "Id_lapso",
                    "Id_ano"
                ) VALUES ($1, $2, $3, $4, $5)
                RETURNING 
                    "Id_seccion" as id,
                    "nombre_seccion" as section_name,
                    "capacidad" as capacity,
                    "Id_materia" as subject_id,
                    "Id_lapso" as period_id,
                    "Id_ano" as academic_year_id
            `,
            values: [
                section_name,
                capacity || 30,
                subject_id,
                lapsoId,
                finalYearId
            ]
        };

        const { rows } = await db.query(query.text, query.values);
        console.log('✅ Sección creada con ID:', rows[0].id, 'nivel:', rows[0].grade_level);
        return rows[0];

    } catch (error) {
        console.error("❌ Error en schedule.createSection:", error);
        throw error;
    }
};

const updateSection = async (id, sectionData) => {
    try {
        const { section_name, grade_level, capacity, subject_id } = sectionData;

        const query = {
            text: `
                UPDATE "Seccion"
                SET 
                    "nombre_seccion" = COALESCE($1, "nombre_seccion"),
                    "capacidad" = COALESCE($2, "capacidad"),
                    "Id_materia" = COALESCE($3, "Id_materia")
                WHERE "Id_seccion" = $4
                RETURNING 
                    "Id_seccion" as id,
                    "nombre_seccion" as section_name,
                    "capacidad" as capacity,
                    "Id_materia" as subject_id,
                    "Id_lapso" as period_id,
                    "Id_ano" as academic_year_id
            `,
            values: [section_name, capacity, subject_id, id]
        };

        const { rows } = await db.query(query.text, query.values);
        return rows[0];
    } catch (error) {
        console.error("❌ Error en schedule.updateSection:", error);
        throw error;
    }
};

// ============================================
// ELIMINAR SECCIÓN
// ============================================
const deleteSection = async (id) => {
    try {
        console.log(`🗑️ Eliminando sección ${id} y todas sus relaciones...`);

        const studentCheck = await db.query(
            'SELECT COUNT(*) as count FROM "Estudiante_Seccion" WHERE "Id_seccion" = $1',
            [id]
        );

        if (studentCheck.rows[0].count > 0) {
            throw new Error(`La sección tiene ${studentCheck.rows[0].count} estudiantes asociados. No se puede eliminar.`);
        }

        await db.query('BEGIN');

        try {
            await db.query('DELETE FROM "Horario" WHERE "Id_seccion" = $1', [id]);
            await db.query('DELETE FROM "Asistencia" WHERE "Id_seccion" = $1', [id]);
            await db.query('DELETE FROM "Boleta_Notas" WHERE "Id_seccion" = $1', [id]);
            await db.query('DELETE FROM "Estructura_Evaluacion" WHERE "Id_seccion" = $1', [id]);

            const query = {
                text: 'DELETE FROM "Seccion" WHERE "Id_seccion" = $1 RETURNING "Id_seccion" as id',
                values: [id]
            };

            const { rows } = await db.query(query.text, query.values);

            await db.query('COMMIT');

            console.log(`✅ Sección ${id} eliminada exitosamente`);
            return rows[0];

        } catch (error) {
            await db.query('ROLLBACK');
            throw error;
        }

    } catch (error) {
        console.error("❌ Error en schedule.deleteSection:", error);

        if (error.code === '23503') {
            throw new Error('No se puede eliminar la sección porque tiene estudiantes u otras relaciones asociadas.');
        }

        throw error;
    }
};

// ============================================
// HORARIOS
// ============================================

const findAllSchedules = async (filters = {}) => {
    try {
        let queryText = `
            SELECT 
                h."Id_horario" as id,
                h."Id_seccion" as section_id,
                s."nombre_seccion" as section_name,
                h."Id_aula" as classroom_id,
                a."nombre_aula" as classroom_name,
                h."Id_profesor" as teacher_id,
                CONCAT(u."nombre", ' ', u."apellido") as teacher_name,
                u."Id_usuario" as teacher_user_id,
                h."Id_bloque" as block_id,
                b."nombre_bloque" as block_name,
                b."inicio_bloque" as start_time,
                b."fin_bloque" as end_time,
                h."Id_dia" as day_id,
                d."nombre_dia" as day_name,
                h."Id_materia" as subject_id,
                m."nombre_materia" as subject_name,
                s."Id_ano" as academic_year_id,
                an."nombre_ano" as academic_year_name
            FROM "Horario" h
            LEFT JOIN "Seccion" s ON h."Id_seccion" = s."Id_seccion"
            LEFT JOIN "Aula" a ON h."Id_aula" = a."Id_aula"
            LEFT JOIN "Profesor" p ON h."Id_profesor" = p."Id_profesor"
            LEFT JOIN "Usuario" u ON p."Id_usuario" = u."Id_usuario"
            LEFT JOIN "Bloque_Horario" b ON h."Id_bloque" = b."Id_bloque"
            LEFT JOIN "Dia" d ON h."Id_dia" = d."Id_dia"
            LEFT JOIN "Materia" m ON h."Id_materia" = m."Id_materia"
            LEFT JOIN "Ano_Academico" an ON s."Id_ano" = an."Id_ano"
            WHERE 1=1
        `;

        const values = [];
        let paramIndex = 1;

        if (filters.academicYearId) {
            queryText += ` AND s."Id_ano" = $${paramIndex}`;
            values.push(filters.academicYearId);
            paramIndex++;
        }

        if (filters.sectionId) {
            queryText += ` AND h."Id_seccion" = $${paramIndex}`;
            values.push(filters.sectionId);
            paramIndex++;
        }

        if (filters.teacherId) {
            queryText += ` AND h."Id_profesor" = $${paramIndex}`;
            values.push(filters.teacherId);
            paramIndex++;
        }

        if (filters.dayId) {
            queryText += ` AND h."Id_dia" = $${paramIndex}`;
            values.push(filters.dayId);
            paramIndex++;
        }

        queryText += ` ORDER BY d."Id_dia", b."inicio_bloque"`;

        const { rows } = await db.query(queryText, values);
        return rows;
    } catch (error) {
        console.error("❌ Error en schedule.findAllSchedules:", error);
        throw error;
    }
};

// ============================================
// CREAR HORARIO - VERSIÓN CORREGIDA CON MATERIA
// ============================================
const createSchedule = async (scheduleData) => {
    try {
        const { section_id, classroom_id, teacher_id, block_id, day_id, subject_id } = scheduleData;

        console.log('📥 MODEL createSchedule - Datos recibidos:', {
            section_id,
            classroom_id,
            teacher_id,
            block_id,
            day_id,
            subject_id
        });

        // PASO 1: Verificar que la sección existe
        const sectionCheck = await db.query(
            'SELECT "Id_seccion", "Id_ano" FROM "Seccion" WHERE "Id_seccion" = $1',
            [section_id]
        );

        if (sectionCheck.rows.length === 0) {
            throw new Error(`La sección ${section_id} no existe`);
        }

        const academicYearId = sectionCheck.rows[0].Id_ano;

        // PASO 2: Obtener el Id_profesor a partir del Id_usuario
        const profesorQuery = await db.query(
            `SELECT "Id_profesor" 
             FROM "Profesor" 
             WHERE "Id_usuario" = $1`,
            [teacher_id]
        );

        if (profesorQuery.rows.length === 0) {
            throw new Error(`El usuario ${teacher_id} no tiene un registro en la tabla Profesor. Debe ser creado como docente primero.`);
        }

        const profesorId = profesorQuery.rows[0].Id_profesor;
        console.log(`✅ Profesor encontrado: Usuario ${teacher_id} → Profesor ID ${profesorId}`);

        // PASO 3: Verificar disponibilidad con el profesorId correcto
        const isAvailable = await checkAvailability({
            academicYearId: academicYearId,
            dayId: day_id,
            blockId: block_id,
            classroomId: classroom_id,
            teacherId: profesorId,
            excludeScheduleId: null
        });

        if (!isAvailable.available) {
            throw new Error(isAvailable.message || 'Conflicto de horario');
        }

        // PASO 4: Insertar el horario CON LA MATERIA
        const query = {
            text: `
                INSERT INTO "Horario" (
                    "Id_seccion", 
                    "Id_aula", 
                    "Id_profesor", 
                    "Id_bloque", 
                    "Id_dia"
                ) VALUES ($1, $2, $3, $4, $5)
                RETURNING 
                    "Id_horario" as id,
                    "Id_seccion" as section_id,
                    "Id_aula" as classroom_id,
                    "Id_profesor" as teacher_id,
                    "Id_bloque" as block_id,
                    "Id_dia" as day_id
            `,
            values: [section_id, classroom_id, profesorId, block_id, day_id]
        };

        const { rows } = await db.query(query.text, query.values);
        console.log('✅ Horario creado:', rows[0]);
        return rows[0];

    } catch (error) {
        console.error("❌ Error en schedule.createSchedule:", error);
        throw error;
    }
};

const updateSchedule = async (id, scheduleData) => {
    try {
        const { classroom_id, teacher_id, block_id, day_id } = scheduleData;

        const currentSchedule = await db.query(
            `SELECT h.*, s."Id_ano" as academic_year_id
             FROM "Horario" h
             LEFT JOIN "Seccion" s ON h."Id_seccion" = s."Id_seccion"
             WHERE h."Id_horario" = $1`,
            [id]
        );

        if (currentSchedule.rows.length === 0) {
            throw new Error('Horario no encontrado');
        }

        const isAvailable = await checkAvailability({
            academicYearId: currentSchedule.rows[0].academic_year_id,
            dayId: day_id,
            blockId: block_id,
            classroomId: classroom_id,
            teacherId: teacher_id,
            excludeScheduleId: id
        });

        if (!isAvailable.available) {
            throw new Error(isAvailable.message || 'Conflicto de horario');
        }

        const query = {
            text: `
                UPDATE "Horario"
                SET 
                    "Id_aula" = COALESCE($1, "Id_aula"),
                    "Id_profesor" = COALESCE($2, "Id_profesor"),
                    "Id_bloque" = COALESCE($3, "Id_bloque"),
                    "Id_dia" = COALESCE($4, "Id_dia")
                WHERE "Id_horario" = $5
                RETURNING 
                    "Id_horario" as id,
                    "Id_seccion" as section_id,
                    "Id_aula" as classroom_id,
                    "Id_profesor" as teacher_id,
                    "Id_bloque" as block_id,
                    "Id_dia" as day_id
            `,
            values: [classroom_id, teacher_id, block_id, day_id, id]
        };

        const { rows } = await db.query(query.text, query.values);
        return rows[0];
    } catch (error) {
        console.error("❌ Error en schedule.updateSchedule:", error);
        throw error;
    }
};

const deleteSchedule = async (id) => {
    try {
        const query = {
            text: 'DELETE FROM "Horario" WHERE "Id_horario" = $1 RETURNING "Id_horario" as id',
            values: [id]
        };

        const { rows } = await db.query(query.text, query.values);
        return rows[0];
    } catch (error) {
        console.error("❌ Error en schedule.deleteSchedule:", error);
        throw error;
    }
};

// ============================================
// VALIDACIÓN DE DISPONIBILIDAD
// ============================================
const checkAvailability = async ({ academicYearId, dayId, blockId, classroomId, teacherId, excludeScheduleId = null }) => {
    try {
        console.log('🔍 Verificando disponibilidad:', {
            academicYearId,
            dayId,
            blockId,
            classroomId,
            teacherId,
            excludeScheduleId
        });

        // 1. Verificar disponibilidad del aula
        let classroomQuery = `
            SELECT 
                h."Id_horario", 
                s."nombre_seccion", 
                CONCAT(u."nombre", ' ', u."apellido") as teacher_name
            FROM "Horario" h
            LEFT JOIN "Seccion" s ON h."Id_seccion" = s."Id_seccion"
            LEFT JOIN "Profesor" p ON h."Id_profesor" = p."Id_profesor"
            LEFT JOIN "Usuario" u ON p."Id_usuario" = u."Id_usuario"
            WHERE h."Id_aula" = $1 
              AND h."Id_dia" = $2 
              AND h."Id_bloque" = $3
              AND s."Id_ano" = $4
        `;

        const classroomValues = [classroomId, dayId, blockId, academicYearId];

        if (excludeScheduleId) {
            classroomQuery += ` AND h."Id_horario" != $5`;
            classroomValues.push(excludeScheduleId);
        }

        const classroomConflict = await db.query(classroomQuery, classroomValues);

        if (classroomConflict.rows.length > 0) {
            return {
                available: false,
                message: `El aula ya está ocupada por ${classroomConflict.rows[0].teacher_name} en la sección ${classroomConflict.rows[0].nombre_seccion}`,
                conflict: {
                    type: 'classroom',
                    section: classroomConflict.rows[0].nombre_seccion,
                    teacher: classroomConflict.rows[0].teacher_name
                }
            };
        }

        // 2. Verificar disponibilidad del profesor
        let teacherQuery = `
            SELECT 
                h."Id_horario", 
                s."nombre_seccion", 
                a."nombre_aula" as classroom_name
            FROM "Horario" h
            LEFT JOIN "Seccion" s ON h."Id_seccion" = s."Id_seccion"
            LEFT JOIN "Aula" a ON h."Id_aula" = a."Id_aula"
            WHERE h."Id_profesor" = $1 
              AND h."Id_dia" = $2 
              AND h."Id_bloque" = $3
              AND s."Id_ano" = $4
        `;

        const teacherValues = [teacherId, dayId, blockId, academicYearId];

        if (excludeScheduleId) {
            teacherQuery += ` AND h."Id_horario" != $5`;
            teacherValues.push(excludeScheduleId);
        }

        const teacherConflict = await db.query(teacherQuery, teacherValues);

        if (teacherConflict.rows.length > 0) {
            return {
                available: false,
                message: `El profesor ya tiene una clase en el aula ${teacherConflict.rows[0].classroom_name} en la sección ${teacherConflict.rows[0].nombre_seccion}`,
                conflict: {
                    type: 'teacher',
                    section: teacherConflict.rows[0].nombre_seccion,
                    classroom: teacherConflict.rows[0].classroom_name
                }
            };
        }

        console.log('✅ Disponibilidad confirmada');
        return { available: true };

    } catch (error) {
        console.error("❌ Error en schedule.checkAvailability:", error);
        throw error;
    }
};

// ============================================
// CATÁLOGOS
// ============================================

const getAllClassrooms = async () => {
    try {
        const query = {
            text: `
                SELECT 
                    "Id_aula" as id,
                    "nombre_aula" as name,
                    "Id_tipo_clase" as type_id
                FROM "Aula"
                ORDER BY "nombre_aula"
            `
        };

        const { rows } = await db.query(query.text);
        return rows;
    } catch (error) {
        console.error("❌ Error en schedule.getAllClassrooms:", error);
        throw error;
    }
};

const getAllDays = async () => {
    try {
        const query = {
            text: `
                SELECT 
                    "Id_dia" as id,
                    "nombre_dia" as name
                FROM "Dia"
                ORDER BY "Id_dia"
            `
        };

        const { rows } = await db.query(query.text);
        return rows;
    } catch (error) {
        console.error("❌ Error en schedule.getAllDays:", error);
        throw error;
    }
};

const getAllBlocks = async () => {
    try {
        const query = {
            text: `
                SELECT 
                    "Id_bloque" as id,
                    "nombre_bloque" as name,
                    "inicio_bloque" as start_time,
                    "fin_bloque" as end_time
                FROM "Bloque_Horario"
                ORDER BY "inicio_bloque"
            `
        };

        const { rows } = await db.query(query.text);
        return rows;
    } catch (error) {
        console.error("❌ Error en schedule.getAllBlocks:", error);
        throw error;
    }
};

// ============================================
// EXPORTAR MODELO
// ============================================

export const ScheduleModel = {
    // Secciones
    findAllSections,
    findSectionById,
    createSection,
    updateSection,
    deleteSection,

    // Horarios
    findAllSchedules,
    createSchedule,
    updateSchedule,
    deleteSchedule,

    // Validación
    checkAvailability,

    // Catálogos
    getAllClassrooms,
    getAllDays,
    getAllBlocks
};
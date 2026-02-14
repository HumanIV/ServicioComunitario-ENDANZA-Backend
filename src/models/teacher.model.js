// models/teacher.model.js
import { db } from "../db/connection.database.js";

// ============================================
// OBTENER TODOS LOS DOCENTES - FILTRADO POR AÑO ACADÉMICO
// ============================================
const findAll = async (academicYearId = null) => {
    try {
        let query;
        
        if (academicYearId) {
            // Filtrar por año académico
            query = {
                text: `
                    SELECT 
                        u."Id_usuario" as id,
                        u."cedula" as dni,
                        u."nombre" as first_name,
                        u."apellido" as last_name,
                        u."correo" as email,
                        u."telefono" as phone,
                        u."estatus_usuario" as status,
                        u."creado_en" as created_at,
                        COALESCE(p."Id_profesor", NULL) as teacher_id,
                        -- ✅ ESPECIALIDAD DEL AÑO ACTUAL (para el badge)
                        (
                            SELECT e."nombre_especialidad"
                            FROM "Profesor_Especialidad" pe
                            JOIN "Especialidad" e ON pe."Id_especialidad" = e."Id_especialidad"
                            WHERE pe."Id_profesor" = p."Id_profesor"
                              AND pe."Id_ano" = $1
                              AND pe."activo" = true
                            LIMIT 1
                        ) as specialty,
                        -- ✅ TODAS LAS ESPECIALIDADES CON SU AÑO
                        COALESCE(
                            (
                                SELECT json_agg(
                                    json_build_object(
                                        'id', e."Id_especialidad",
                                        'name', e."nombre_especialidad",
                                        'area', e."area",
                                        'academicYearId', pe."Id_ano"
                                    )
                                )
                                FROM "Profesor_Especialidad" pe
                                JOIN "Especialidad" e ON pe."Id_especialidad" = e."Id_especialidad"
                                WHERE pe."Id_profesor" = p."Id_profesor"
                                  AND pe."Id_ano" = $1
                                  AND pe."activo" = true
                            ),
                            '[]'::json
                        ) as specialties,
                        -- ✅ GRADOS DEL AÑO ACTUAL
                        COALESCE(
                            (
                                SELECT json_agg(
                                    json_build_object(
                                        'id', g."Id_grado",
                                        'name', g."nombre_grado",
                                        'level', g."nivel",
                                        'academicYearId', pg."Id_ano"
                                    )
                                )
                                FROM "Profesor_Grado" pg
                                JOIN "Grado" g ON pg."Id_grado" = g."Id_grado"
                                WHERE pg."Id_profesor" = p."Id_profesor"
                                  AND pg."Id_ano" = $1
                                  AND pg."activo" = true
                            ),
                            '[]'::json
                        ) as grades
                    FROM "Usuario" u
                    LEFT JOIN "Profesor" p ON u."Id_usuario" = p."Id_usuario"
                    WHERE u."Id_rol" = 2
                    ORDER BY u."creado_en" DESC
                `,
                values: [academicYearId]
            };
        } else {
            // Sin filtro de año - traer TODAS las especialidades y grados
            query = {
                text: `
                    SELECT 
                        u."Id_usuario" as id,
                        u."cedula" as dni,
                        u."nombre" as first_name,
                        u."apellido" as last_name,
                        u."correo" as email,
                        u."telefono" as phone,
                        u."estatus_usuario" as status,
                        u."creado_en" as created_at,
                        COALESCE(p."Id_profesor", NULL) as teacher_id,
                        -- Para compatibilidad, traer la especialidad más reciente
                        (
                            SELECT e."nombre_especialidad"
                            FROM "Profesor_Especialidad" pe
                            JOIN "Especialidad" e ON pe."Id_especialidad" = e."Id_especialidad"
                            WHERE pe."Id_profesor" = p."Id_profesor"
                              AND pe."activo" = true
                            ORDER BY pe."Id_ano" DESC
                            LIMIT 1
                        ) as specialty,
                        -- ✅ TODAS LAS ESPECIALIDADES
                        COALESCE(
                            (
                                SELECT json_agg(
                                    json_build_object(
                                        'id', e."Id_especialidad",
                                        'name', e."nombre_especialidad",
                                        'area', e."area",
                                        'academicYearId', pe."Id_ano"
                                    )
                                )
                                FROM "Profesor_Especialidad" pe
                                JOIN "Especialidad" e ON pe."Id_especialidad" = e."Id_especialidad"
                                WHERE pe."Id_profesor" = p."Id_profesor"
                                  AND pe."activo" = true
                            ),
                            '[]'::json
                        ) as specialties,
                        -- ✅ TODOS LOS GRADOS
                        COALESCE(
                            (
                                SELECT json_agg(
                                    json_build_object(
                                        'id', g."Id_grado",
                                        'name', g."nombre_grado",
                                        'level', g."nivel",
                                        'academicYearId', pg."Id_ano"
                                    )
                                )
                                FROM "Profesor_Grado" pg
                                JOIN "Grado" g ON pg."Id_grado" = g."Id_grado"
                                WHERE pg."Id_profesor" = p."Id_profesor"
                                  AND pg."activo" = true
                            ),
                            '[]'::json
                        ) as grades
                    FROM "Usuario" u
                    LEFT JOIN "Profesor" p ON u."Id_usuario" = p."Id_usuario"
                    WHERE u."Id_rol" = 2
                    ORDER BY u."creado_en" DESC
                `
            };
        }
        
        const { rows } = await db.query(query.text, query.values || []);
        console.log(`📋 TeacherModel.findAll: ${rows.length} docentes encontrados${academicYearId ? ` para año ${academicYearId}` : ''}`);
        
        return rows;
    } catch (error) {
        console.error("❌ Error en teacher.findAll:", error);
        throw error;
    }
};

// ============================================
// OBTENER DOCENTE POR ID - CON FILTRO DE AÑO
// ============================================
const findById = async (id, academicYearId = null) => {
    try {
        let query;
        
        if (academicYearId) {
            query = {
                text: `
                    SELECT 
                        u."Id_usuario" as id,
                        u."cedula" as dni,
                        u."nombre" as first_name,
                        u."apellido" as last_name,
                        u."correo" as email,
                        u."telefono" as phone,
                        u."estatus_usuario" as status,
                        u."creado_en" as created_at,
                        COALESCE(p."Id_profesor", NULL) as teacher_id,
                        -- ✅ ESPECIALIDAD DEL AÑO ACTUAL
                        (
                            SELECT e."nombre_especialidad"
                            FROM "Profesor_Especialidad" pe
                            JOIN "Especialidad" e ON pe."Id_especialidad" = e."Id_especialidad"
                            WHERE pe."Id_profesor" = p."Id_profesor"
                              AND pe."Id_ano" = $2
                              AND pe."activo" = true
                            LIMIT 1
                        ) as specialty,
                        -- ✅ TODAS LAS ESPECIALIDADES CON SU AÑO
                        COALESCE(
                            (
                                SELECT json_agg(
                                    json_build_object(
                                        'id', e."Id_especialidad",
                                        'name', e."nombre_especialidad",
                                        'area', e."area",
                                        'academicYearId', pe."Id_ano"
                                    )
                                )
                                FROM "Profesor_Especialidad" pe
                                JOIN "Especialidad" e ON pe."Id_especialidad" = e."Id_especialidad"
                                WHERE pe."Id_profesor" = p."Id_profesor"
                                  AND pe."Id_ano" = $2
                                  AND pe."activo" = true
                            ),
                            '[]'::json
                        ) as specialties,
                        -- ✅ GRADOS DEL AÑO ACTUAL
                        COALESCE(
                            (
                                SELECT json_agg(
                                    json_build_object(
                                        'id', g."Id_grado",
                                        'name', g."nombre_grado",
                                        'level', g."nivel",
                                        'academicYearId', pg."Id_ano"
                                    )
                                )
                                FROM "Profesor_Grado" pg
                                JOIN "Grado" g ON pg."Id_grado" = g."Id_grado"
                                WHERE pg."Id_profesor" = p."Id_profesor"
                                  AND pg."Id_ano" = $2
                                  AND pg."activo" = true
                            ),
                            '[]'::json
                        ) as grades
                    FROM "Usuario" u
                    LEFT JOIN "Profesor" p ON u."Id_usuario" = p."Id_usuario"
                    WHERE u."Id_usuario" = $1 AND u."Id_rol" = 2
                `,
                values: [id, academicYearId]
            };
        } else {
            query = {
                text: `
                    SELECT 
                        u."Id_usuario" as id,
                        u."cedula" as dni,
                        u."nombre" as first_name,
                        u."apellido" as last_name,
                        u."correo" as email,
                        u."telefono" as phone,
                        u."estatus_usuario" as status,
                        u."creado_en" as created_at,
                        COALESCE(p."Id_profesor", NULL) as teacher_id,
                        -- Para compatibilidad, traer la especialidad más reciente
                        (
                            SELECT e."nombre_especialidad"
                            FROM "Profesor_Especialidad" pe
                            JOIN "Especialidad" e ON pe."Id_especialidad" = e."Id_especialidad"
                            WHERE pe."Id_profesor" = p."Id_profesor"
                              AND pe."activo" = true
                            ORDER BY pe."Id_ano" DESC
                            LIMIT 1
                        ) as specialty,
                        -- ✅ TODAS LAS ESPECIALIDADES
                        COALESCE(
                            (
                                SELECT json_agg(
                                    json_build_object(
                                        'id', e."Id_especialidad",
                                        'name', e."nombre_especialidad",
                                        'area', e."area",
                                        'academicYearId', pe."Id_ano"
                                    )
                                )
                                FROM "Profesor_Especialidad" pe
                                JOIN "Especialidad" e ON pe."Id_especialidad" = e."Id_especialidad"
                                WHERE pe."Id_profesor" = p."Id_profesor"
                                  AND pe."activo" = true
                            ),
                            '[]'::json
                        ) as specialties,
                        -- ✅ TODOS LOS GRADOS
                        COALESCE(
                            (
                                SELECT json_agg(
                                    json_build_object(
                                        'id', g."Id_grado",
                                        'name', g."nombre_grado",
                                        'level', g."nivel",
                                        'academicYearId', pg."Id_ano"
                                    )
                                )
                                FROM "Profesor_Grado" pg
                                JOIN "Grado" g ON pg."Id_grado" = g."Id_grado"
                                WHERE pg."Id_profesor" = p."Id_profesor"
                                  AND pg."activo" = true
                            ),
                            '[]'::json
                        ) as grades
                    FROM "Usuario" u
                    LEFT JOIN "Profesor" p ON u."Id_usuario" = p."Id_usuario"
                    WHERE u."Id_usuario" = $1 AND u."Id_rol" = 2
                `,
                values: [id]
            };
        }
        
        const { rows } = await db.query(query.text, query.values);
        return rows[0];
    } catch (error) {
        console.error("❌ Error en teacher.findById:", error);
        throw error;
    }
};

// ============================================
// ASIGNAR ESPECIALIDAD (versión legacy - sin año)
// ============================================
const assignSpecialty = async (userId, specialty) => {
    try {
        const query = {
            text: `
                UPDATE "Profesor"
                SET "especialidad" = $1
                WHERE "Id_usuario" = $2
                RETURNING 
                    "Id_profesor" as teacher_id,
                    "especialidad" as specialty,
                    "Id_usuario" as user_id
            `,
            values: [specialty, userId]
        };
        
        const { rows } = await db.query(query.text, query.values);
        return rows[0];
    } catch (error) {
        console.error("❌ Error en teacher.assignSpecialty:", error);
        throw error;
    }
};

// ============================================
// ASIGNAR ESPECIALIDAD POR AÑO (NUEVO)
// ============================================
const assignSpecialtyByYear = async (userId, specialtyId, academicYearId) => {
    try {
        console.log(`📝 Asignando especialidad ${specialtyId} a usuario ${userId} para año ${academicYearId}`);
        
        // 1. Verificar si el usuario existe y es docente
        const userCheck = await db.query(
            'SELECT "Id_rol" FROM "Usuario" WHERE "Id_usuario" = $1',
            [userId]
        );
        
        if (userCheck.rows.length === 0) {
            throw new Error(`Usuario ${userId} no existe`);
        }
        
        if (userCheck.rows[0].Id_rol !== 2) {
            throw new Error(`Usuario ${userId} no es docente (rol: ${userCheck.rows[0].Id_rol})`);
        }
        
        // 2. Obtener el Id_profesor (o crearlo si no existe)
        let profResult = await db.query(
            'SELECT "Id_profesor" FROM "Profesor" WHERE "Id_usuario" = $1',
            [userId]
        );
        
        let profesorId;
        
        if (profResult.rows.length === 0) {
            console.log(`⚠️ Profesor no encontrado para usuario ${userId}, creando automáticamente...`);
            
            const insertResult = await db.query(
                `INSERT INTO "Profesor" ("Id_usuario", "especialidad")
                 VALUES ($1, NULL)
                 RETURNING "Id_profesor"`,
                [userId]
            );
            
            profesorId = insertResult.rows[0].Id_profesor;
            console.log(`✅ Profesor creado automáticamente con ID: ${profesorId}`);
        } else {
            profesorId = profResult.rows[0].Id_profesor;
        }
        
        // 3. Iniciar transacción
        await db.query('BEGIN');
        
        // 4. Eliminar especialidad actual del año específico
        await db.query(
            'DELETE FROM "Profesor_Especialidad" WHERE "Id_profesor" = $1 AND "Id_ano" = $2',
            [profesorId, academicYearId]
        );
        
        // 5. Insertar nueva especialidad para el año
        if (specialtyId) {
            await db.query(
                `INSERT INTO "Profesor_Especialidad" ("Id_profesor", "Id_especialidad", "Id_ano", "fecha_asignacion")
                 VALUES ($1, $2, $3, CURRENT_TIMESTAMP)`,
                [profesorId, specialtyId, academicYearId]
            );
        }
        
        // 6. Obtener la especialidad asignada
        const specialtyResult = await db.query(
            `SELECT 
                e."Id_especialidad" as id,
                e."nombre_especialidad" as name,
                e."area"
             FROM "Profesor_Especialidad" pe
             JOIN "Especialidad" e ON pe."Id_especialidad" = e."Id_especialidad"
             WHERE pe."Id_profesor" = $1 AND pe."Id_ano" = $2`,
            [profesorId, academicYearId]
        );
        
        // 7. Commit transacción
        await db.query('COMMIT');
        
        console.log(`✅ Especialidad asignada correctamente a profesor ${profesorId} para año ${academicYearId}:`, specialtyResult.rows[0]);
        
        return { 
            profesorId, 
            specialtyId,
            academicYearId,
            specialty: specialtyResult.rows[0] || null
        };
    } catch (error) {
        await db.query('ROLLBACK');
        console.error("❌ Error en teacher.assignSpecialtyByYear:", error);
        throw error;
    }
};

// ============================================
// ASIGNAR GRADOS AL DOCENTE - CON AÑO ACADÉMICO
// ============================================
const assignGrades = async (userId, gradeIds, academicYearId) => {
    try {
        console.log(`📝 Asignando grados a usuario ${userId} para año ${academicYearId}:`, gradeIds);
        
        // 1. Verificar si el usuario existe y es docente
        const userCheck = await db.query(
            'SELECT "Id_rol" FROM "Usuario" WHERE "Id_usuario" = $1',
            [userId]
        );
        
        if (userCheck.rows.length === 0) {
            throw new Error(`Usuario ${userId} no existe`);
        }
        
        if (userCheck.rows[0].Id_rol !== 2) {
            throw new Error(`Usuario ${userId} no es docente (rol: ${userCheck.rows[0].Id_rol})`);
        }
        
        // 2. Obtener el Id_profesor (o crearlo si no existe)
        let profResult = await db.query(
            'SELECT "Id_profesor" FROM "Profesor" WHERE "Id_usuario" = $1',
            [userId]
        );
        
        let profesorId;
        
        if (profResult.rows.length === 0) {
            console.log(`⚠️ Profesor no encontrado para usuario ${userId}, creando automáticamente...`);
            
            const insertResult = await db.query(
                `INSERT INTO "Profesor" ("Id_usuario", "especialidad")
                 VALUES ($1, NULL)
                 RETURNING "Id_profesor"`,
                [userId]
            );
            
            profesorId = insertResult.rows[0].Id_profesor;
            console.log(`✅ Profesor creado automáticamente con ID: ${profesorId}`);
        } else {
            profesorId = profResult.rows[0].Id_profesor;
        }
        
        // 3. Iniciar transacción
        await db.query('BEGIN');
        
        // 4. Eliminar asignaciones actuales del año específico
        await db.query(
            'DELETE FROM "Profesor_Grado" WHERE "Id_profesor" = $1 AND "Id_ano" = $2',
            [profesorId, academicYearId]
        );
        
        // 5. Insertar nuevas asignaciones para el año
        if (gradeIds && gradeIds.length > 0) {
            for (const gradoId of gradeIds) {
                await db.query(
                    `INSERT INTO "Profesor_Grado" ("Id_profesor", "Id_grado", "Id_ano", "fecha_asignacion")
                     VALUES ($1, $2, $3, CURRENT_TIMESTAMP)`,
                    [profesorId, gradoId, academicYearId]
                );
            }
        }
        
        // 6. Obtener los grados asignados para este año
        const gradesResult = await db.query(
            `SELECT 
                g."Id_grado" as id,
                g."nombre_grado" as name,
                g."nivel" as level
             FROM "Profesor_Grado" pg
             JOIN "Grado" g ON pg."Id_grado" = g."Id_grado"
             WHERE pg."Id_profesor" = $1 AND pg."Id_ano" = $2
             ORDER BY g."Id_grado"`,
            [profesorId, academicYearId]
        );
        
        // 7. Commit transacción
        await db.query('COMMIT');
        
        console.log(`✅ Grados asignados correctamente a profesor ${profesorId} para año ${academicYearId}:`, gradesResult.rows);
        
        return { 
            profesorId, 
            gradeIds,
            academicYearId,
            grades: gradesResult.rows
        };
    } catch (error) {
        await db.query('ROLLBACK');
        console.error("❌ Error en teacher.assignGrades:", error);
        throw error;
    }
};

// ============================================
// OBTENER GRADOS DE UN DOCENTE PARA UN AÑO ESPECÍFICO
// ============================================
const getTeacherGradesByYear = async (userId, academicYearId) => {
    try {
        const profResult = await db.query(
            'SELECT "Id_profesor" FROM "Profesor" WHERE "Id_usuario" = $1',
            [userId]
        );
        
        if (profResult.rows.length === 0) {
            return [];
        }
        
        const profesorId = profResult.rows[0].Id_profesor;
        
        const query = {
            text: `
                SELECT 
                    g."Id_grado" as id,
                    g."nombre_grado" as name,
                    g."nivel" as level,
                    pg."fecha_asignacion"
                FROM "Profesor_Grado" pg
                JOIN "Grado" g ON pg."Id_grado" = g."Id_grado"
                WHERE pg."Id_profesor" = $1 AND pg."Id_ano" = $2 AND pg."activo" = true
                ORDER BY g."Id_grado"
            `,
            values: [profesorId, academicYearId]
        };
        
        const { rows } = await db.query(query.text, query.values);
        return rows;
    } catch (error) {
        console.error("❌ Error en teacher.getTeacherGradesByYear:", error);
        throw error;
    }
};

// ============================================
// FUNCIONES AUXILIARES PARA COPIAR ASIGNACIONES
// ============================================

const copyGrades = async (fromYearId, toYearId) => {
    try {
        const assignments = await db.query(
            `SELECT "Id_profesor", "Id_grado"
             FROM "Profesor_Grado"
             WHERE "Id_ano" = $1 AND "activo" = true`,
            [fromYearId]
        );
        
        if (assignments.rows.length === 0) {
            return { copied: 0 };
        }
        
        let copiedCount = 0;
        
        for (const row of assignments.rows) {
            const exists = await db.query(
                `SELECT 1 FROM "Profesor_Grado"
                 WHERE "Id_profesor" = $1 AND "Id_grado" = $2 AND "Id_ano" = $3`,
                [row.Id_profesor, row.Id_grado, toYearId]
            );
            
            if (exists.rows.length === 0) {
                await db.query(
                    `INSERT INTO "Profesor_Grado" ("Id_profesor", "Id_grado", "Id_ano", "fecha_asignacion")
                     VALUES ($1, $2, $3, CURRENT_TIMESTAMP)`,
                    [row.Id_profesor, row.Id_grado, toYearId]
                );
                copiedCount++;
            }
        }
        
        return { copied: copiedCount };
    } catch (error) {
        throw error;
    }
};

const copySpecialties = async (fromYearId, toYearId) => {
    try {
        const specialties = await db.query(
            `SELECT "Id_profesor", "Id_especialidad"
             FROM "Profesor_Especialidad"
             WHERE "Id_ano" = $1 AND "activo" = true`,
            [fromYearId]
        );
        
        if (specialties.rows.length === 0) {
            return { copied: 0 };
        }
        
        let copiedCount = 0;
        
        for (const row of specialties.rows) {
            const exists = await db.query(
                `SELECT 1 FROM "Profesor_Especialidad"
                 WHERE "Id_profesor" = $1 AND "Id_ano" = $2`,
                [row.Id_profesor, toYearId]
            );
            
            if (exists.rows.length === 0) {
                await db.query(
                    `INSERT INTO "Profesor_Especialidad" ("Id_profesor", "Id_especialidad", "Id_ano", "fecha_asignacion")
                     VALUES ($1, $2, $3, CURRENT_TIMESTAMP)`,
                    [row.Id_profesor, row.Id_especialidad, toYearId]
                );
                copiedCount++;
            }
        }
        
        console.log(`✅ Copiadas ${copiedCount} especialidades de año ${fromYearId} a ${toYearId}`);
        
        return { copied: copiedCount };
    } catch (error) {
        console.error("❌ Error en copySpecialties:", error);
        throw error;
    }
};

// ============================================
// COPIAR ASIGNACIONES DE UN AÑO A OTRO (GRADOS + ESPECIALIDADES)
// ============================================
const copyAssignments = async (fromYearId, toYearId) => {
    try {
        await db.query('BEGIN');
        
        // 1. Copiar grados
        const gradesResult = await copyGrades(fromYearId, toYearId);
        
        // 2. Copiar especialidades
        const specialtiesResult = await copySpecialties(fromYearId, toYearId);
        
        await db.query('COMMIT');
        
        console.log(`✅ Copiadas ${gradesResult.copied} asignaciones de grados y ${specialtiesResult.copied} especialidades de año ${fromYearId} a ${toYearId}`);
        
        return {
            copied: gradesResult.copied + specialtiesResult.copied,
            copiedGrades: gradesResult.copied,
            copiedSpecialties: specialtiesResult.copied,
            fromYear: fromYearId,
            toYear: toYearId,
            message: `Se copiaron ${gradesResult.copied} grados y ${specialtiesResult.copied} especialidades exitosamente`
        };
    } catch (error) {
        await db.query('ROLLBACK');
        console.error("❌ Error en teacher.copyAssignments:", error);
        throw error;
    }
};

// ============================================
// OBTENER TODAS LAS ESPECIALIDADES
// ============================================
const getAllSpecialties = async () => {
    try {
        const query = {
            text: `
                SELECT 
                    "Id_especialidad" as id,
                    "nombre_especialidad" as name,
                    "descripcion" as description,
                    "area"
                FROM "Especialidad"
                WHERE activo = true
                ORDER BY "nombre_especialidad"
            `
        };
        
        const { rows } = await db.query(query.text);
        return rows;
    } catch (error) {
        console.error("❌ Error en teacher.getAllSpecialties:", error);
        throw error;
    }
};

// ============================================
// OBTENER TODOS LOS GRADOS
// ============================================
const getAllGrades = async () => {
    try {
        const query = {
            text: `
                SELECT 
                    "Id_grado" as id,
                    "nombre_grado" as name,
                    "nivel" as level
                FROM "Grado"
                WHERE activo = true
                ORDER BY "Id_grado"
            `
        };
        
        const { rows } = await db.query(query.text);
        return rows;
    } catch (error) {
        console.error("❌ Error en teacher.getAllGrades:", error);
        throw error;
    }
};

// ============================================
// ACTUALIZAR DATOS BÁSICOS DEL DOCENTE
// ============================================
const update = async (userId, teacherData) => {
    try {
        const { dni, first_name, last_name, phone, email, status } = teacherData;
        
        let dbStatus = 'activo';
        if (status === 'inactive') dbStatus = 'inactivo';
        if (status === 'suspended') dbStatus = 'suspendido';
        
        const query = {
            text: `
                UPDATE "Usuario"
                SET 
                    "cedula" = COALESCE($1, "cedula"),
                    "nombre" = COALESCE($2, "nombre"),
                    "apellido" = COALESCE($3, "apellido"),
                    "telefono" = COALESCE($4, "telefono"),
                    "correo" = COALESCE($5, "correo"),
                    "estatus_usuario" = COALESCE($6, "estatus_usuario"),
                    "actualizado_en" = CURRENT_TIMESTAMP
                WHERE "Id_usuario" = $7 AND "Id_rol" = 2
                RETURNING 
                    "Id_usuario" as id,
                    "cedula" as dni,
                    "nombre" as first_name,
                    "apellido" as last_name,
                    "telefono" as phone,
                    "correo" as email,
                    "estatus_usuario" as status
            `,
            values: [dni, first_name, last_name, phone, email, dbStatus, userId]
        };
        
        const { rows } = await db.query(query.text, query.values);
        return rows[0];
    } catch (error) {
        console.error("❌ Error en teacher.update:", error);
        throw error;
    }
};

// ============================================
// ELIMINAR DOCENTE (DESACTIVAR)
// ============================================
const remove = async (userId) => {
    try {
        const query = {
            text: `
                UPDATE "Usuario"
                SET "estatus_usuario" = 'inactivo',
                    "actualizado_en" = CURRENT_TIMESTAMP
                WHERE "Id_usuario" = $1 AND "Id_rol" = 2
                RETURNING "Id_usuario" as id
            `,
            values: [userId]
        };
        
        const { rows } = await db.query(query.text, query.values);
        return rows[0];
    } catch (error) {
        console.error("❌ Error en teacher.remove:", error);
        throw error;
    }
};

// ============================================
// OBTENER HORARIO DEL DOCENTE
// ============================================
const getSchedule = async (userId) => {
    try {
        const profResult = await db.query(
            'SELECT "Id_profesor" FROM "Profesor" WHERE "Id_usuario" = $1',
            [userId]
        );
        
        if (profResult.rows.length === 0) {
            return [];
        }
        
        const profesorId = profResult.rows[0].Id_profesor;
        
        const query = {
            text: `
                SELECT 
                    h."Id_horario" as id,
                    h."Id_dia" as day,
                    h."Id_bloque" as block,
                    a."nombre_aula" as classroom
                FROM "Horario" h
                LEFT JOIN "Aula" a ON h."Id_aula" = a."Id_aula"
                WHERE h."Id_profesor" = $1
                ORDER BY h."Id_dia", h."Id_bloque"
            `,
            values: [profesorId]
        };
        
        const { rows } = await db.query(query.text, query.values);
        return rows;
    } catch (error) {
        console.error("❌ Error en teacher.getSchedule:", error);
        throw error;
    }
};

// ============================================
// OBTENER ESTUDIANTES DEL DOCENTE
// ============================================
const getStudents = async (userId) => {
    try {
        const profResult = await db.query(
            'SELECT "Id_profesor" FROM "Profesor" WHERE "Id_usuario" = $1',
            [userId]
        );
        
        if (profResult.rows.length === 0) {
            return [];
        }
        
        const profesorId = profResult.rows[0].Id_profesor;
        
        const query = {
            text: `
                SELECT DISTINCT
                    e."Id_estudiante" as student_id,
                    u."Id_usuario" as user_id,
                    u."nombre" as first_name,
                    u."apellido" as last_name,
                    u."cedula" as dni,
                    g."nombre_grado" as grade
                FROM "Estudiante" e
                JOIN "Usuario" u ON e."Id_usuario" = u."Id_usuario"
                JOIN "Grado" g ON e."Id_grado" = g."Id_grado"
                JOIN "Profesor_Grado" pg ON g."Id_grado" = pg."Id_grado"
                WHERE pg."Id_profesor" = $1
                ORDER BY u."apellido", u."nombre"
            `,
            values: [profesorId]
        };
        
        const { rows } = await db.query(query.text, query.values);
        return rows;
    } catch (error) {
        console.error("❌ Error en teacher.getStudents:", error);
        throw error;
    }
};

// ============================================
// EXPORTAR MODELO
// ============================================
export const TeacherModel = {
    findAll,
    findById,
    assignSpecialty,
    assignSpecialtyByYear, // NUEVO
    assignGrades,
    getTeacherGradesByYear,
    copyAssignments,
    update,
    remove,
    getAllSpecialties,
    getAllGrades,
    getSchedule,
    getStudents
};
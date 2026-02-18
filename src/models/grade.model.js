// models/grade.model.js
import { db } from "../db/connection.database.js";
import fs from 'fs';
import path from 'path';

const logFile = path.resolve('grades_debug.txt');
const log = (msg) => {
    try {
        fs.appendFileSync(logFile, new Date().toISOString() + ' ' + msg + '\n');
    } catch (e) { console.error('Error logging', e); }
};

// ============================================
// MODELO DE NOTAS
// ============================================

/**
 * Obtiene todas las notas de una sección
 */
const getGradesBySection = async (sectionId, lapsoId = null) => {
    try {
        const query = {
            text: `
                SELECT 
                    cn."Id_nota" as id,
                    cn."puntaje" as score,
                    cn."esta_formalizada" as is_formalized,
                    cn."Id_estudiante" as student_id,
                    CONCAT(e."nombre", ' ', e."apellido") as student_name,
                    cn."Id_estructura_evaluacion" as evaluation_structure_id,
                    ee."numero_evaluacion" as evaluation_number,
                    ee."porcentaje_peso" as weight,
                    ee."Id_seccion" as section_id
                FROM "Carga_Nota" cn
                INNER JOIN "Estudiante" e ON cn."Id_estudiante" = e."Id_estudiante"
                INNER JOIN "Estructura_Evaluacion" ee ON cn."Id_estructura_evaluacion" = ee."Id_estructura_evaluacion"
                WHERE ee."Id_seccion" = $1
                  AND ($2::int IS NULL OR ee."Id_lapso" = $2::int)
                ORDER BY e."apellido", e."nombre", ee."numero_evaluacion"
            `,
            values: [sectionId, lapsoId]
        };

        const { rows } = await db.query(query.text, query.values);
        return rows;
    } catch (error) {
        console.error("❌ Error en getGradesBySection:", error);
        throw error;
    }
};

/**
 * Guarda o actualiza notas de estudiantes
 */
const saveGrades = async (gradesData) => {
    const client = await db.pool.connect();
    log('--- INICIO SAVE GRADES ---');
    log('Datos recibidos: ' + JSON.stringify(gradesData));

    try {
        await client.query('BEGIN');

        const { sectionId, grades, academicYearId, isAdmin = false, lapsoId } = gradesData;
        const results = [];

        // Si es docente, la nota queda pendiente de aprobación (false)
        // Si es admin, la nota se formaliza directamente (true)
        const formalizada = isAdmin ? true : false;
        log(`Formalizada: ${formalizada}, Sección: ${sectionId}, Lapso: ${lapsoId}`);

        // Obtener la estructura de evaluaciones de la sección, incluyendo el tipo para replicarlo
        const structureQuery = {
            text: `
                SELECT "Id_estructura_evaluacion", "numero_evaluacion", "Id_tipo_evaluacion"
                FROM "Estructura_Evaluacion"
                WHERE "Id_seccion" = $1 
                  AND ($2::int IS NULL OR "Id_lapso" = $2::int)
            `,
            values: [sectionId, lapsoId]
        };

        const structureResult = await client.query(structureQuery.text, structureQuery.values);
        log(`Estructuras encontradas: ${structureResult.rows.length}`);

        // Intentar obtener un tipo de evaluación por defecto de las existentes
        let defaultTypeId = null;
        if (structureResult.rows.length > 0) {
            // Usar el primer tipo encontrado que no sea nulo
            const found = structureResult.rows.find(r => r.Id_tipo_evaluacion);
            if (found) defaultTypeId = found.Id_tipo_evaluacion;
        }
        log(`Tipo por defecto: ${defaultTypeId}`);

        // Mapear número de evaluación a ID de estructura
        const evalMap = {};
        structureResult.rows.forEach(row => {
            evalMap[row.numero_evaluacion] = row.Id_estructura_evaluacion;
        });

        // Procesar cada estudiante
        for (const [studentId, notas] of Object.entries(grades)) {
            log(`Procesando estudiante ${studentId}. Notas: ${JSON.stringify(notas)}`);
            for (let i = 1; i <= 4; i++) {
                const nota = notas[`n${i}`];
                // Solo procesar si hay nota y no es cadena vacía
                if (nota !== undefined && nota !== "" && nota !== null) {
                    let estructuraId = evalMap[i];
                    log(`  Eval ${i}: Nota ${nota}. EstructuraID: ${estructuraId}`);

                    // Si no existe estructura para esta evaluación, crearla automáticamente
                    if (!estructuraId) {
                        log(`  ✨ Creando estructura automática para evaluación ${i} en sección ${sectionId}`);
                        const createStructQuery = {
                            text: `
                                INSERT INTO "Estructura_Evaluacion" 
                                ("Id_seccion", "numero_evaluacion", "porcentaje_peso", "Id_tipo_evaluacion", "Id_lapso") 
                                VALUES ($1, $2, $3, $4, $5) 
                                RETURNING "Id_estructura_evaluacion"
                            `,
                            values: [sectionId, i, 25, defaultTypeId, lapsoId] // Peso default 25%
                        };
                        const newStruct = await client.query(createStructQuery.text, createStructQuery.values);
                        estructuraId = newStruct.rows[0].Id_estructura_evaluacion;
                        evalMap[i] = estructuraId; // Actualizar mapa para futuras iteraciones
                        log(`  ✅ Nueva estructura creada: ${estructuraId}`);
                    }

                    // Verificar si ya existe una nota para esta evaluación
                    const checkQuery = {
                        text: `
                            SELECT "Id_nota", "esta_formalizada"
                            FROM "Carga_Nota" 
                            WHERE "Id_estudiante" = $1 
                              AND "Id_estructura_evaluacion" = $2
                        `,
                        values: [studentId, estructuraId]
                    };

                    const existing = await client.query(checkQuery.text, checkQuery.values);

                    if (existing.rows.length > 0) {
                        // Actualizar nota existente
                        log(`  🔄 Actualizando nota existente ${existing.rows[0].Id_nota}`);
                        const updateQuery = {
                            text: `
                                UPDATE "Carga_Nota"
                                SET "puntaje" = $1, "esta_formalizada" = $2
                                WHERE "Id_nota" = $3
                                RETURNING "Id_nota" as id
                            `,
                            values: [parseFloat(nota), formalizada, existing.rows[0].Id_nota]
                        };

                        const result = await client.query(updateQuery.text, updateQuery.values);
                        results.push(result.rows[0]);
                    } else {
                        // Insertar nueva nota
                        log(`  ➕ Insertando nueva nota`);
                        const insertQuery = {
                            text: `
                                INSERT INTO "Carga_Nota" 
                                ("puntaje", "esta_formalizada", "Id_estudiante", "Id_estructura_evaluacion")
                                VALUES ($1, $2, $3, $4)
                                RETURNING "Id_nota" as id
                            `,
                            values: [parseFloat(nota), formalizada, studentId, estructuraId]
                        };

                        const result = await client.query(insertQuery.text, insertQuery.values);
                        results.push(result.rows[0]);
                    }
                } else {
                    // log(`  Eval ${i}: Ignorada (vacía/null)`);
                }
            }
        }

        await client.query('COMMIT');
        log('--- COMMIT EXITOSO ---');
        return results;

    } catch (error) {
        await client.query('ROLLBACK');
        log('❌ ERROR ROLLBACK: ' + error.message);
        console.error("❌ Error en saveGrades:", error);
        throw error;
    } finally {
        client.release();
    }
};

/**
 * Obtiene los estudiantes de una sección
 */
const getStudentsBySection = async (sectionId) => {
    try {
        const query = {
            text: `
                SELECT 
                    e."Id_estudiante" as id,
                    e."nombre" as first_name,
                    e."apellido" as last_name,
                    CONCAT(e."nombre", ' ', e."apellido") as full_name,
                    e."cedula" as dni,
                    e."fecha_nacimiento" as birth_date
                FROM "Estudiante_Seccion" es
                INNER JOIN "Estudiante" e ON es."Id_estudiante" = e."Id_estudiante"
                WHERE es."Id_seccion" = $1
                ORDER BY e."apellido", e."nombre"
            `,
            values: [sectionId]
        };

        const { rows } = await db.query(query.text, query.values);
        return rows;
    } catch (error) {
        console.error("❌ Error en getStudentsBySection:", error);
        throw error;
    }
};

/**
 * Obtiene la estructura de evaluaciones de una sección
 */
const getEvaluationStructure = async (sectionId, lapsoId = null) => {
    try {
        const query = {
            text: `
                SELECT 
                    ee."Id_estructura_evaluacion" as id,
                    ee."numero_evaluacion" as number,
                    ee."porcentaje_peso" as weight,
                    te."nombre_evaluacion" as type_name
                FROM "Estructura_Evaluacion" ee
                LEFT JOIN "Tipo_Evaluacion" te ON ee."Id_tipo_evaluacion" = te."Id_tipo_evaluacion"
                WHERE ee."Id_seccion" = $1
                  AND ($2::int IS NULL OR ee."Id_lapso" = $2::int)
                ORDER BY ee."numero_evaluacion"
            `,
            values: [sectionId, lapsoId]
        };

        const { rows } = await db.query(query.text, query.values);
        return rows;
    } catch (error) {
        console.error("❌ Error en getEvaluationStructure:", error);
        throw error;
    }
};

/**
 * Obtiene las notas de un estudiante específico
 */
const getStudentGrades = async (studentId) => {
    try {
        const query = {
            text: `
                SELECT 
                    cn."Id_nota" as id,
                    cn."puntaje" as score,
                    cn."esta_formalizada" as is_formalized,
                    ee."numero_evaluacion" as evaluation_number,
                    ee."porcentaje_peso" as weight,
                    s."nombre_seccion" as section_name,
                    m."nombre_materia" as subject_name
                FROM "Carga_Nota" cn
                INNER JOIN "Estructura_Evaluacion" ee ON cn."Id_estructura_evaluacion" = ee."Id_estructura_evaluacion"
                INNER JOIN "Seccion" s ON ee."Id_seccion" = s."Id_seccion"
                LEFT JOIN "Materia" m ON s."Id_materia" = m."Id_materia"
                WHERE cn."Id_estudiante" = $1
                ORDER BY s."Id_seccion", ee."numero_evaluacion"
            `,
            values: [studentId]
        };

        const { rows } = await db.query(query.text, query.values);
        return rows;
    } catch (error) {
        console.error("❌ Error en getStudentGrades:", error);
        throw error;
    }
};

export const GradeModel = {
    getGradesBySection,
    saveGrades,
    getStudentsBySection,
    getEvaluationStructure,
    getStudentGrades
};
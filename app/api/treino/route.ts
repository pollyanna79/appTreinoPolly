import sql from 'mssql';
import {
  databaseErrorResponse,
  getDatabasePool,
} from '@/app/services/database';
import {
  hasCompletedWorkoutToday,
  getWeekdayName,
  prepareUserWorkoutRotation,
} from '@/app/services/workoutCatalog';

const weekdayNames = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
];

export async function GET(request: Request) {
  const userId = Number(new URL(request.url).searchParams.get('userId'));
  if (!Number.isInteger(userId) || userId < 1) {
    return Response.json(
      { error: 'Não foi possível identificar o usuário do treino.' },
      { status: 400 },
    );
  }

  try {
    const pool = await getDatabasePool();
    const transaction = new sql.Transaction(pool);
    await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
    let planDetails: {
      objectiveId: number;
      frequency: number;
      phase: number;
      objective: string;
      workoutsInCombo: number;
      completedToday: boolean;
    };

    try {
      const userResult = await new sql.Request(transaction)
        .input('userId', sql.Int, userId)
        .query(`
          SELECT
            u.objetivo_id,
            u.frequencia_semanal,
            ISNULL(u.dias_concluidos, 0) AS dias_concluidos,
            CASE
              WHEN ISNULL(u.fase_combo, 0) < 1 THEN 1
              ELSE u.fase_combo
            END AS fase_combo,
            o.titulo AS objetivo
          FROM dbo.Usuarios u
          LEFT JOIN dbo.Objetivos o ON o.id = u.objetivo_id
          WHERE u.id = @userId
        `);

      if (userResult.recordset.length === 0) {
        await transaction.rollback();
        return Response.json({ error: 'Usuário não encontrado.' }, { status: 404 });
      }

      const savedUser = userResult.recordset[0];
      if (!savedUser.objetivo_id || !savedUser.frequencia_semanal || !savedUser.objetivo) {
        await transaction.rollback();
        return Response.json(
          { error: 'Selecione seu objetivo e sua frequência para gerar o treino.' },
          { status: 409 },
        );
      }

      const objectiveId = Number(savedUser.objetivo_id);
      const frequency = Number(savedUser.frequencia_semanal);
      const rotation = await prepareUserWorkoutRotation(
        transaction,
        userId,
        objectiveId,
        frequency,
        Number(savedUser.fase_combo),
        Number(savedUser.dias_concluidos),
      );
      planDetails = {
        objectiveId,
        frequency,
        phase: rotation.phase,
        objective: savedUser.objetivo,
        workoutsInCombo: rotation.workoutsInCombo,
        completedToday: await hasCompletedWorkoutToday(transaction, userId),
      };
      await transaction.commit();
    } catch (error) {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        console.error('[consulta do plano de treino] Falha ao desfazer transação:', rollbackError);
      }
      throw error;
    }

    const plan = await pool
      .request()
      .input('objectiveId', sql.Int, planDetails.objectiveId)
      .input('frequency', sql.Int, planDetails.frequency)
      .input('phase', sql.Int, planDetails.phase)
      .query(`
        SELECT
          c.id AS comboId,
          c.dia_semana_num AS diaSemana,
          e.id AS exercicioId,
          e.nome,
          e.foto_url AS imagem,
          e.grupo_muscular AS grupoMuscular,
          ce.repeticoes,
          ce.peso_sugerido AS pesoSugerido
        FROM dbo.CombosTreino c
        INNER JOIN dbo.ComboExercicios ce ON ce.combo_id = c.id
        INNER JOIN dbo.Exercicios e ON e.id = ce.exercicio_id
        WHERE c.objetivo_id = @objectiveId
          AND c.frequencia_semanal = @frequency
          AND c.fase = @phase
        ORDER BY c.dia_semana_num, ce.id
      `);

    const workoutsByWeekday = new Map<
      number,
      {
        id: number;
        diaSemana: number;
        nomeDia: string;
        exercicios: Array<{
          id: number;
          nome: string;
          imagem: string;
          grupoMuscular: string;
          repeticoes: string;
          pesoSugerido: string;
        }>;
      }
    >();

    for (const row of plan.recordset) {
      let workout = workoutsByWeekday.get(row.diaSemana);
      if (!workout) {
        workout = {
          id: row.comboId,
          diaSemana: row.diaSemana,
          nomeDia: getWeekdayName(row.diaSemana),
          exercicios: [],
        };
        workoutsByWeekday.set(row.diaSemana, workout);
      }

      workout.exercicios.push({
        id: row.exercicioId,
        nome: row.nome,
        imagem: row.imagem,
        grupoMuscular: row.grupoMuscular,
        repeticoes: row.repeticoes,
        pesoSugerido: row.pesoSugerido,
      });
    }

    const treinos = [...workoutsByWeekday.values()];
    if (treinos.length !== planDetails.frequency) {
      return Response.json(
        { error: 'O plano do banco está incompleto. Salve suas preferências novamente.' },
        { status: 409 },
      );
    }

    const todayWeekday = new Date().getDay();
    const nextWorkout =
      treinos.find((workout) => workout.diaSemana === todayWeekday) ?? treinos[0];

    return Response.json({
      objetivo: planDetails.objective,
      frequenciaSemanal: planDetails.frequency,
      fase: planDetails.phase,
      treinosNoCombo: planDetails.workoutsInCombo,
      treinoConcluidoHoje: planDetails.completedToday,
      diaAtual: weekdayNames[todayWeekday],
      treinoSelecionado: nextWorkout.id,
      treinos,
    });
  } catch (error) {
    return databaseErrorResponse(error, 'consulta do plano de treino');
  }
}

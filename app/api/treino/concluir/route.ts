import sql from 'mssql';
import {
  databaseErrorResponse,
  getDatabasePool,
  readJsonBody,
} from '@/app/services/database';
import {
  registerWorkoutCompletion,
  WorkoutCompletionConflictError,
} from '@/app/services/workoutCatalog';

export async function POST(request: Request) {
  const body = await readJsonBody(request);
  if (
    !body ||
    !Number.isInteger(body.userId) ||
    Number(body.userId) < 1 ||
    !Number.isInteger(body.comboId) ||
    Number(body.comboId) < 1
  ) {
    return Response.json(
      { error: 'Não foi possível identificar o usuário e o combo concluído.' },
      { status: 400 },
    );
  }

  try {
    const pool = await getDatabasePool();
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      const progress = await registerWorkoutCompletion(
        transaction,
        Number(body.userId),
        Number(body.comboId),
      );
      await transaction.commit();
      return Response.json({
        dias_concluidos: progress.totalCompleted,
        fase_combo: progress.phase,
        faseAlterada: progress.phaseChanged,
        treinosNoCombo: progress.workoutsInCombo,
        message: progress.phaseChanged
          ? 'Treino concluído! Seu novo combo já está pronto.'
          : 'Treino concluído!',
      });
    } catch (error) {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        console.error('[conclusão do treino] Falha ao desfazer transação:', rollbackError);
      }
      if (error instanceof WorkoutCompletionConflictError) {
        return Response.json({ error: error.message }, { status: 409 });
      }
      throw error;
    }
  } catch (error) {
    return databaseErrorResponse(error, 'conclusão do treino');
  }
}

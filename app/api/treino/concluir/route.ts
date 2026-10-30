import sql from 'mssql';
import {
  databaseErrorResponse,
  getDatabasePool,
  readJsonBody,
} from '@/app/services/database';
import { ensureWorkoutPlan } from '@/app/services/workoutCatalog';

export async function POST(request: Request) {
  const body = await readJsonBody(request);
  if (!body || !Number.isInteger(body.userId) || Number(body.userId) < 1) {
    return Response.json(
      { error: 'Não foi possível identificar o usuário do treino.' },
      { status: 400 },
    );
  }

  try {
    const pool = await getDatabasePool();
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      const result = await new sql.Request(transaction)
        .input('userId', sql.Int, Number(body.userId))
        .query(`
          UPDATE dbo.Usuarios
          SET
            dias_concluidos = CASE
              WHEN ISNULL(dias_concluidos, 0) + 1 >= 90 THEN 0
              ELSE ISNULL(dias_concluidos, 0) + 1
            END,
            fase_combo = CASE
              WHEN ISNULL(dias_concluidos, 0) + 1 >= 90
                THEN COALESCE(NULLIF(fase_combo, 0), 1) + 1
              ELSE COALESCE(NULLIF(fase_combo, 0), 1)
            END
          OUTPUT
            inserted.dias_concluidos AS dias_concluidos,
            inserted.fase_combo AS fase_combo,
            inserted.objetivo_id AS objetivo_id,
            inserted.frequencia_semanal AS frequencia_semanal
          WHERE id = @userId
        `);

      if (result.recordset.length === 0) {
        await transaction.rollback();
        return Response.json({ error: 'Usuário não encontrado.' }, { status: 404 });
      }

      const progress = result.recordset[0];
      const faseAlterada = progress.dias_concluidos === 0;

      if (faseAlterada) {
        if (!progress.objetivo_id || !progress.frequencia_semanal) {
          throw new Error('O usuário não possui objetivo e frequência para gerar a nova fase.');
        }

        await ensureWorkoutPlan(
          transaction,
          Number(progress.objetivo_id),
          Number(progress.frequencia_semanal),
          Number(progress.fase_combo),
        );
      }

      await transaction.commit();
      return Response.json({
        dias_concluidos: progress.dias_concluidos,
        fase_combo: progress.fase_combo,
        faseAlterada,
        message: faseAlterada
          ? 'Treino concluído! Sua nova fase já está pronta.'
          : 'Treino concluído!',
      });
    } catch (error) {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        console.error('[conclusão do treino] Falha ao desfazer transação:', rollbackError);
      }
      throw error;
    }
  } catch (error) {
    return databaseErrorResponse(error, 'conclusão do treino');
  }
}

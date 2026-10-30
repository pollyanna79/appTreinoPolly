import {
  databaseErrorResponse,
  getDatabasePool,
} from '@/app/services/database';

export async function GET() {
  try {
    const pool = await getDatabasePool();
    const result = await pool
      .request()
      .query('SELECT id, titulo, descricao FROM dbo.Objetivos ORDER BY id');

    return Response.json(result.recordset);
  } catch (error) {
    return databaseErrorResponse(error, 'consulta de objetivos');
  }
}

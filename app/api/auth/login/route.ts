import bcrypt from 'bcryptjs';
import sql from 'mssql';
import {
  databaseErrorResponse,
  ensureUserFocusColumn,
  getDatabasePool,
  readJsonBody,
} from '@/app/services/database';

export async function POST(request: Request) {
  const body = await readJsonBody(request);
  if (
    !body ||
    typeof body.email !== 'string' ||
    typeof body.senha !== 'string' ||
    !body.email.trim() ||
    !body.senha
  ) {
    return Response.json(
      { error: 'Informe e-mail e senha para entrar.' },
      { status: 400 },
    );
  }

  try {
    const pool = await getDatabasePool();
    await ensureUserFocusColumn(pool);
    const result = await pool
      .request()
      .input('email', sql.VarChar(150), body.email.trim().toLowerCase())
      .query(
        'SELECT id, nome, email, senha, objetivo_id, foco_treino, frequencia_semanal, dias_concluidos, fase_combo FROM dbo.Usuarios WHERE email = @email',
      );

    if (result.recordset.length === 0) {
      return Response.json(
        { message: 'Usuário não encontrado.' },
        { status: 404 },
      );
    }

    const user = result.recordset[0];
    const passwordMatches = await bcrypt.compare(body.senha, user.senha);
    if (!passwordMatches) {
      return Response.json({ message: 'Senha incorreta.' }, { status: 401 });
    }

    return Response.json({
      id: user.id,
      nome: user.nome,
      email: user.email,
      objetivo_id: user.objetivo_id,
      foco_treino: user.foco_treino,
      frequencia_semanal: user.frequencia_semanal,
      dias_concluidos: user.dias_concluidos,
      fase_combo: user.fase_combo,
    });
  } catch (error) {
    return databaseErrorResponse(error, 'login');
  }
}

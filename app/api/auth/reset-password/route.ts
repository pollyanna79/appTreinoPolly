import bcrypt from 'bcryptjs';
import sql from 'mssql';
import {
  databaseErrorResponse,
  getDatabasePool,
  readJsonBody,
} from '@/app/services/database';

export async function POST(request: Request) {
  const body = await readJsonBody(request);
  if (
    !body ||
    typeof body.email !== 'string' ||
    typeof body.novaSenha !== 'string' ||
    !body.email.trim() ||
    !body.novaSenha
  ) {
    return Response.json(
      { error: 'Informe o e-mail e a nova senha.' },
      { status: 400 },
    );
  }

  try {
    const pool = await getDatabasePool();
    const user = await pool
      .request()
      .input('email', sql.VarChar(255), body.email.trim().toLowerCase())
      .query('SELECT id FROM dbo.Usuarios WHERE email = @email');

    if (user.recordset.length === 0) {
      return Response.json(
        { message: 'E-mail não cadastrado na plataforma.' },
        { status: 404 },
      );
    }

    const hashedPassword = await bcrypt.hash(body.novaSenha, 10);
    await pool
      .request()
      .input('id', sql.Int, user.recordset[0].id)
      .input('senha', sql.VarChar(60), hashedPassword)
      .query('UPDATE dbo.Usuarios SET senha = @senha WHERE id = @id');

    return Response.json({ message: 'Senha atualizada com sucesso!' });
  } catch (error) {
    return databaseErrorResponse(error, 'recuperação de senha');
  }
}

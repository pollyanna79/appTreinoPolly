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
    typeof body.nome !== 'string' ||
    typeof body.email !== 'string' ||
    typeof body.senha !== 'string' ||
    !body.nome.trim() ||
    !body.email.trim() ||
    !body.senha ||
    body.nome.trim().length > 100 ||
    body.email.trim().length > 150
  ) {
    return Response.json(
      { error: 'Informe nome, e-mail e senha para criar a conta.' },
      { status: 400 },
    );
  }

  const nome = body.nome.trim();
  const email = body.email.trim().toLowerCase();

  try {
    const pool = await getDatabasePool();
    const existingUser = await pool
      .request()
      .input('email', sql.VarChar(150), email)
      .query('SELECT id FROM dbo.Usuarios WHERE email = @email');

    if (existingUser.recordset.length > 0) {
      return Response.json(
        { error: 'Este e-mail já está cadastrado.' },
        { status: 409 },
      );
    }

    const hashedPassword = await bcrypt.hash(body.senha, 10);
    await pool
      .request()
      .input('nome', sql.VarChar(100), nome)
      .input('email', sql.VarChar(150), email)
      .input('senha', sql.VarChar(255), hashedPassword)
      .query(
        'INSERT INTO dbo.Usuarios (nome, email, senha) VALUES (@nome, @email, @senha)',
      );

    return Response.json(
      { message: 'Usuário cadastrado com sucesso!' },
      { status: 201 },
    );
  } catch (error) {
    const sqlNumber =
      typeof error === 'object' && error !== null && 'number' in error
        ? error.number
        : undefined;

    if (sqlNumber === 2601 || sqlNumber === 2627) {
      return Response.json(
        { error: 'Este e-mail já está cadastrado.' },
        { status: 409 },
      );
    }

    return databaseErrorResponse(error, 'cadastro');
  }
}

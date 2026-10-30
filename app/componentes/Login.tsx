'use client';

import { useState, type FormEvent } from 'react';
import { apiService } from '../services/api';
import type { SetTela, SetUsuario } from '../page';

export default function Login({
  setTela,
  setUser,
}: {
  setTela: SetTela;
  setUser: SetUsuario;
}) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [enviando, setEnviando] = useState(false);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setEnviando(true);

    try {
      const user = await apiService.login(email, senha);
      setUser(user);
      setTela(
        user.objetivo_id && user.frequencia_semanal ? 'treino' : 'onboarding',
      );
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Não foi possível entrar.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="auth-card">
      <p className="eyebrow">Bom ter você de volta</p>
      <h1 className="auth-title">Seu próximo treino começa aqui.</h1>
      <p className="auth-copy">Entre para acompanhar seu plano e continuar de onde parou.</p>

      <form onSubmit={handleLogin} className="form-stack">
        <label className="field-label">
          E-mail
          <input
            type="email"
            autoComplete="email"
            placeholder="voce@email.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="text-input"
            required
          />
        </label>
        <label className="field-label">
          Senha
          <input
            type="password"
            autoComplete="current-password"
            placeholder="Sua senha"
            value={senha}
            onChange={(event) => setSenha(event.target.value)}
            className="text-input"
            required
          />
        </label>
        <button type="submit" className="primary-button" disabled={enviando}>
          {enviando ? 'CONECTANDO...' : 'ENTRAR'}
        </button>
      </form>

      <button onClick={() => setTela('recuperar')} className="link-button">
        Esqueceu a senha? Recuperar acesso
      </button>
      <button onClick={() => setTela('cadastro')} className="link-button">
        Ainda não tem conta? Criar conta
      </button>
    </div>
  );
}

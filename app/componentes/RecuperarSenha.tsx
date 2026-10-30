'use client';

import { useState, type FormEvent } from 'react';
import { apiService } from '../services/api';
import type { SetTela } from '../page';

export default function RecuperarSenha({ setTela }: { setTela: SetTela }) {
  const [email, setEmail] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [enviando, setEnviando] = useState(false);

  const handleReset = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setEnviando(true);

    try {
      const data = await apiService.resetPassword(email, novaSenha);
      alert(data.message);
      setTela('login');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Erro ao redefinir a senha.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="auth-card">
      <p className="eyebrow">Recuperação de acesso</p>
      <h1 className="auth-title">Nova senha</h1>
      <p className="auth-copy">Informe o e-mail da conta e escolha sua nova senha.</p>

      <form onSubmit={handleReset} className="form-stack">
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
          Nova senha
          <input
            type="password"
            autoComplete="new-password"
            placeholder="Digite a nova senha"
            value={novaSenha}
            onChange={(event) => setNovaSenha(event.target.value)}
            className="text-input"
            required
          />
        </label>
        <button type="submit" className="primary-button" disabled={enviando}>
          {enviando ? 'ATUALIZANDO...' : 'ATUALIZAR SENHA'}
        </button>
      </form>

      <button onClick={() => setTela('login')} className="link-button">
        Voltar para o login
      </button>
    </div>
  );
}

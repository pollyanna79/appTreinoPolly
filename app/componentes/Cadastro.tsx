'use client';

import { useState, type FormEvent } from 'react';
import { apiService } from '../services/api';
import type { SetTela } from '../page';

export default function Cadastro({ setTela }: { setTela: SetTela }) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [enviando, setEnviando] = useState(false);

  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setEnviando(true);

    try {
      const data = await apiService.register(nome, email, senha);
      alert(data.message);
      setTela('login');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Erro ao criar a conta.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="auth-card">
      <p className="eyebrow">Comece sua jornada</p>
      <h1 className="auth-title">Crie sua conta</h1>
      <p className="auth-copy">Seus treinos e sua evolução reunidos em um só lugar.</p>

      <form onSubmit={handleRegister} className="form-stack">
        <label className="field-label">
          Nome completo
          <input
            type="text"
            autoComplete="name"
            placeholder="Como podemos te chamar?"
            value={nome}
            onChange={(event) => setNome(event.target.value)}
            className="text-input"
            required
          />
        </label>
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
            autoComplete="new-password"
            placeholder="Crie uma senha"
            value={senha}
            onChange={(event) => setSenha(event.target.value)}
            className="text-input"
            required
          />
        </label>
        <button type="submit" className="primary-button" disabled={enviando}>
          {enviando ? 'CRIANDO CONTA...' : 'CRIAR CONTA'}
        </button>
      </form>

      <button onClick={() => setTela('login')} className="link-button">
        Já tem uma conta? Entrar
      </button>
    </div>
  );
}

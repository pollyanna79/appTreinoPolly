'use client';

import { useState, type Dispatch, type SetStateAction } from 'react';
import Cadastro from './componentes/Cadastro';
import Alimentacao from './componentes/Alimentacao';
import Login from './componentes/Login';
import Onboarding from './componentes/Onboarding';
import RecuperarSenha from './componentes/RecuperarSenha';
import Treino from './componentes/Treino';
import type { Usuario } from './services/api';

export type Tela =
  | 'login'
  | 'cadastro'
  | 'recuperar'
  | 'onboarding'
  | 'treino'
  | 'alimentacao';
export type { Usuario } from './services/api';

export type SetTela = Dispatch<SetStateAction<Tela>>;
export type SetUsuario = Dispatch<SetStateAction<Usuario | null>>;

export default function Page() {
  const [tela, setTela] = useState<Tela>('login');
  const [user, setUser] = useState<Usuario | null>(null);

  const alternarTema = () => {
    const temaAtual = document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
    const proximoTema = temaAtual === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = proximoTema;
    localStorage.setItem('treino-theme', proximoTema);
  };

  return (
    <main className="app-shell">
      <header className="app-header">
        <div className="brand-mark" aria-hidden="true">T+</div>
        <div>
          <p className="brand-name">TREINO+</p>
          <p className="brand-caption">Consistência que transforma</p>
        </div>
        <button
          type="button"
          className="theme-toggle"
          onClick={alternarTema}
          aria-label="Alternar entre tema claro e escuro"
          title="Alternar entre tema claro e escuro"
        >
          <span aria-hidden="true">◐</span>
          Alternar tema
        </button>
      </header>

      <section className="screen-content">
        {tela === 'login' && <Login setTela={setTela} setUser={setUser} />}
        {tela === 'cadastro' && <Cadastro setTela={setTela} />}
        {tela === 'recuperar' && <RecuperarSenha setTela={setTela} />}
        {tela === 'onboarding' && user && (
          <Onboarding user={user} setTela={setTela} setUser={setUser} />
        )}
        {tela === 'treino' && user && (
          <Treino user={user} setTela={setTela} setUser={setUser} />
        )}
        {tela === 'alimentacao' && user && (
          <Alimentacao user={user} setTela={setTela} setUser={setUser} />
        )}
      </section>

      <footer className="app-footer">Um passo de cada vez. Um treino de cada vez.</footer>
    </main>
  );
}

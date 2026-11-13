'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { apiService } from '../services/api';
import type { PlanoTreino } from '../services/api';
import type { WorkoutFocus } from '../services/api';
import type { SetTela, SetUsuario, Usuario } from '../page';

const focusLabels: Record<WorkoutFocus, string> = {
  'pernas-gluteos': 'pernas e glúteos',
  'superiores-empurrar': 'peito, ombros e tríceps',
  'superiores-puxar': 'costas e bíceps',
  'abdomen-core': 'abdômen e core',
  'corpo-inteiro': 'corpo inteiro',
};

export default function Treino({
  user,
  setTela,
  setUser,
}: {
  user: Usuario;
  setTela: SetTela;
  setUser: SetUsuario;
}) {
  const [plano, setPlano] = useState<PlanoTreino | null>(null);
  const [treinoAtivo, setTreinoAtivo] = useState<number | null>(null);
  const [concluidoHoje, setConcluidoHoje] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [concluindo, setConcluindo] = useState(false);
  const [erro, setErro] = useState('');
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    let active = true;

    apiService
      .carregarTreino(user.id)
      .then((data) => {
        if (active) {
          setPlano(data);
          setTreinoAtivo(data.treinoSelecionado);
          setConcluidoHoje(data.treinoConcluidoHoje);
          setErro('');
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setErro(
            error instanceof Error
              ? error.message
              : 'Não foi possível carregar o treino do banco de dados.',
          );
        }
      })
      .finally(() => {
        if (active) {
          setCarregando(false);
        }
      });

    return () => {
      active = false;
    };
  }, [tentativa, user.id]);

  const concluirTreino = async () => {
    setConcluindo(true);
    try {
      if (!activeWorkout || concluidoHoje) {
        return;
      }

      const progress = await apiService.concluirTreino(user.id, activeWorkout.id);
      setUser((currentUser) =>
        currentUser ? { ...currentUser, ...progress } : currentUser,
      );
      setPlano((currentPlan) =>
        currentPlan
          ? {
              ...currentPlan,
              treinosNoCombo: progress.treinosNoCombo,
              treinoConcluidoHoje: true,
            }
          : currentPlan,
      );
      setConcluidoHoje(true);

      if (progress.faseAlterada) {
        try {
          const nextPlan = await apiService.carregarTreino(user.id);
          setPlano(nextPlan);
          setTreinoAtivo(nextPlan.treinoSelecionado);
          setConcluidoHoje(nextPlan.treinoConcluidoHoje);
        } catch {
          setTentativa((current) => current + 1);
        }
      }

      alert(progress.message);
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : 'Não foi possível registrar o treino.',
      );
    } finally {
      setConcluindo(false);
    }
  };

  const activeWorkout = plano?.treinos.find((workout) => workout.id === treinoAtivo);

  if (carregando) {
    return (
      <div className="workout-state" role="status">
        <p className="eyebrow">Preparando seu plano</p>
        <h1 className="section-title">Carregando treinos do banco de dados...</h1>
      </div>
    );
  }

  if (erro || !plano) {
    return (
      <div className="workout-state">
        <p className="eyebrow">Não foi possível abrir o plano</p>
        <h1 className="section-title">Seu treino não foi carregado.</h1>
        <p className="section-copy" role="alert">
          {erro || 'O banco não retornou um plano de treino para esta conta.'}
        </p>
        <button
          type="button"
          className="primary-button"
          onClick={() => {
            setCarregando(true);
            setTentativa((current) => current + 1);
          }}
        >
          TENTAR NOVAMENTE
        </button>
        <button
          type="button"
          className="link-button"
          onClick={() => setTela('onboarding')}
        >
          Voltar e escolher objetivo e frequência
        </button>
      </div>
    );
  }

  return (
    <div className="workout-page">
      <div className="workout-heading">
        <div>
          <p className="eyebrow">Seu plano salvo no banco de dados</p>
          <h1 className="workout-title">Vamos nessa, {user.nome.split(' ')[0]}.</h1>
          <p className="workout-subtitle">
            {plano.objetivo} · foco em {focusLabels[plano.focoTreino]} ·{' '}
            {plano.frequenciaSemanal} treinos por semana · Fase {plano.fase}
          </p>
        </div>
        <div className="workout-heading-actions">
          <div
            className="progress-panel"
            aria-label={`${plano.treinosNoCombo} de 60 treinos concluídos neste combo`}
          >
            <div className="progress-caption">
              <span>Treinos concluídos neste combo</span>
              <strong>{plano.treinosNoCombo}/60</strong>
            </div>
            <div
              className="progress-track"
              role="progressbar"
              aria-valuenow={plano.treinosNoCombo}
              aria-valuemin={0}
              aria-valuemax={60}
            >
              <div
                className="progress-fill"
                style={{ width: `${Math.min((plano.treinosNoCombo / 60) * 100, 100)}%` }}
              />
            </div>
          </div>
          <button
            type="button"
            className="secondary-button"
            onClick={() => setTela('alimentacao')}
          >
            Menu alimentar
          </button>
        </div>
      </div>

      <div className="workout-day-list" role="tablist" aria-label="Treinos da semana">
        {plano.treinos.map((workout, index) => (
          <button
            key={workout.id}
            type="button"
            role="tab"
            aria-selected={treinoAtivo === workout.id}
            aria-controls={`treino-${workout.id}`}
            className="workout-day-option"
            onClick={() => setTreinoAtivo(workout.id)}
          >
            <span>Treino {String.fromCharCode(65 + index)}</span>
            <strong>{workout.nomeDia}</strong>
          </button>
        ))}
      </div>

      {activeWorkout && (
        <section
          id={`treino-${activeWorkout.id}`}
          role="tabpanel"
          aria-label={`Treino de ${activeWorkout.nomeDia}`}
        >
          <div className="day-heading">
            <div>
              <p className="eyebrow">{activeWorkout.nomeDia}</p>
              <h2 className="section-title">Treino {String.fromCharCode(65 + plano.treinos.indexOf(activeWorkout))}</h2>
            </div>
            <button
              type="button"
              className="secondary-button"
              onClick={() => setTela('onboarding')}
            >
              Ajustar plano
            </button>
          </div>

          <div className="exercise-grid">
            {activeWorkout.exercicios.map((exercise) => (
              <article key={exercise.id} className="exercise-card">
                <div className="exercise-image-grid">
                  {exercise.imagem.split('|').map((image, imageIndex, images) => (
                    <figure className="exercise-image-frame" key={image}>
                      <Image
                        src={image}
                        alt={
                          images.length > 1
                            ? `${exercise.nome}, demonstração ${imageIndex + 1} de ${images.length}`
                            : `Demonstração do movimento: ${exercise.nome}`
                        }
                        width={480}
                        height={360}
                        className="exercise-image"
                      />
                    </figure>
                  ))}
                </div>
                <div className="exercise-info">
                  <h3 className="exercise-name">{exercise.nome}</h3>
                  <div className="exercise-details">
                    <span className="detail-chip">{exercise.grupoMuscular}</span>
                    <span className="detail-chip">{exercise.repeticoes}</span>
                    <span className="detail-chip">{exercise.pesoSugerido}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {plano.aerobico && (
            <aside className="cardio-panel">
              <span className="cardio-icon" aria-hidden="true">♡</span>
              <div>
                <p className="eyebrow">Complemento aeróbico</p>
                <h3>Movimente-se no seu ritmo</h3>
                <p>{plano.aerobico}</p>
              </div>
            </aside>
          )}

          <p className="training-note">
            Use uma carga adequada ao seu nível e mantenha a execução controlada.
            Se sentir dor, interrompa o exercício.
          </p>
          <a
            className="exercise-credit-link"
            href="/exercicios/CREDITOS.txt"
            target="_blank"
            rel="noreferrer"
          >
            Créditos e licenças das imagens
          </a>
          <button
            type="button"
            className="primary-button finish-button"
            onClick={concluirTreino}
            disabled={concluindo || concluidoHoje}
          >
            {concluindo
              ? 'REGISTRANDO TREINO...'
              : concluidoHoje
                ? 'TREINO DE HOJE JÁ CONCLUÍDO'
                : 'CONCLUIR TREINO DE HOJE'}
          </button>
        </section>
      )}

      <button
        type="button"
        className="secondary-button logout-button"
        onClick={() => {
          setUser(null);
          setTela('login');
        }}
      >
        Sair da conta
      </button>
    </div>
  );
}

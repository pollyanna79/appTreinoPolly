'use client';

import { useEffect, useState } from 'react';
import { apiService } from '../services/api';
import type { Objetivo, WorkoutFocus } from '../services/api';
import type { SetTela, SetUsuario, Usuario } from '../page';

const focusOptionsByObjective: Record<number, { value: WorkoutFocus; label: string; description: string }[]> = {
  1: [
    { value: 'pernas-gluteos', label: 'Pernas e glúteos', description: 'Mais volume para membros inferiores.' },
    { value: 'superiores-empurrar', label: 'Peito, ombros e tríceps', description: 'Ênfase nos movimentos de empurrar.' },
    { value: 'superiores-puxar', label: 'Costas e bíceps', description: 'Ênfase nos movimentos de puxar.' },
  ],
  2: [
    { value: 'abdomen-core', label: 'Abdômen e core', description: 'Inclui estabilidade e trabalho de core.' },
    { value: 'corpo-inteiro', label: 'Corpo inteiro', description: 'Distribui o trabalho entre os principais grupos musculares.' },
  ],
};

function getDefaultFocus(objectiveId: number): WorkoutFocus {
  return objectiveId === 1 ? 'pernas-gluteos' : objectiveId === 2 ? 'abdomen-core' : 'corpo-inteiro';
}

export default function Onboarding({
  user,
  setTela,
  setUser,
}: {
  user: Usuario;
  setTela: SetTela;
  setUser: SetUsuario;
}) {
  const [objetivoSelecionado, setObjetivoSelecionado] = useState<number | null>(
    user.objetivo_id,
  );
  const [focoSelecionado, setFocoSelecionado] = useState<WorkoutFocus>(
    user.foco_treino ?? (user.objetivo_id ? getDefaultFocus(user.objetivo_id) : 'corpo-inteiro'),
  );
  const [frequencia, setFrequencia] = useState(user.frequencia_semanal ?? 3);
  const [salvando, setSalvando] = useState(false);
  const [objetivos, setObjetivos] = useState<Objetivo[]>([]);
  const [carregandoObjetivos, setCarregandoObjetivos] = useState(true);
  const [erroObjetivos, setErroObjetivos] = useState('');
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    let active = true;

    apiService
      .listarObjetivos()
      .then((data) => {
        if (active) {
          setObjetivos(data);
          setErroObjetivos('');
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setErroObjetivos(
            error instanceof Error
              ? error.message
              : 'Não foi possível carregar os objetivos do banco de dados.',
          );
        }
      })
      .finally(() => {
        if (active) {
          setCarregandoObjetivos(false);
        }
      });

    return () => {
      active = false;
    };
  }, [tentativa]);

  const handleSalvar = async () => {
    if (!objetivoSelecionado) {
      alert('Selecione um objetivo para continuar.');
      return;
    }

    setSalvando(true);
    try {
      await apiService.salvarOnboarding(
        user.id,
        objetivoSelecionado,
        frequencia,
        focoSelecionado,
      );
      setUser((currentUser) =>
        currentUser
          ? {
              ...currentUser,
              objetivo_id: objetivoSelecionado,
              foco_treino: focoSelecionado,
              frequencia_semanal: frequencia,
            }
          : currentUser,
      );
      setTela('treino');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Não foi possível salvar suas preferências.');
    } finally {
      setSalvando(false);
    }
  };

  const focusOptions = focusOptionsByObjective[objetivoSelecionado ?? -1] ?? [];

  return (
    <div className="onboarding-panel">
      <div className="section-heading">
        <p className="eyebrow">Personalize seu plano</p>
        <h1 className="section-title">Qual é o seu objetivo, {user.nome.split(' ')[0]}?</h1>
        <p className="section-copy">Vamos usar suas preferências para orientar sua jornada.</p>
      </div>

      {carregandoObjetivos && (
        <p className="section-copy" role="status">Carregando objetivos do banco de dados...</p>
      )}
      {erroObjetivos && (
        <div className="inline-alert" role="alert">
          <span>{erroObjetivos}</span>
          <button
            type="button"
            className="secondary-button"
            onClick={() => {
              setCarregandoObjetivos(true);
              setTentativa((current) => current + 1);
            }}
          >
            Tentar novamente
          </button>
        </div>
      )}
      {!carregandoObjetivos && !erroObjetivos && objetivos.length === 0 && (
        <p className="section-copy" role="status">
          Nenhum objetivo foi encontrado na tabela dbo.Objetivos.
        </p>
      )}
      <div className="goal-grid">
        {objetivos.map((item) => (
          <button
            key={item.id}
            type="button"
            className="goal-option"
            aria-pressed={objetivoSelecionado === item.id}
            onClick={() => {
              if (objetivoSelecionado !== item.id) {
                setFocoSelecionado(getDefaultFocus(item.id));
              }
              setObjetivoSelecionado(item.id);
            }}
          >
            <h2 className="goal-title">{item.titulo}</h2>
            <p className="goal-description">{item.descricao}</p>
          </button>
        ))}
      </div>

      {focusOptions.length > 0 && (
        <div className="frequency-section">
          <h2 className="frequency-title">
            {objetivoSelecionado === 1
              ? 'Qual região você quer priorizar para ganhar massa muscular?'
              : 'Qual é sua principal zona de foco para tonificação ou gasto calórico?'}
          </h2>
          <div className="goal-grid">
            {focusOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className="goal-option"
                aria-pressed={focoSelecionado === option.value}
                onClick={() => setFocoSelecionado(option.value)}
              >
                <h3 className="goal-title">{option.label}</h3>
                <p className="goal-description">{option.description}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="frequency-section">
        <h2 className="frequency-title">Quantos dias por semana você pretende treinar?</h2>
        <div className="frequency-row">
          {[2, 3, 4, 5, 6].map((quantity) => (
            <button
              key={quantity}
              type="button"
              className="frequency-option"
              aria-pressed={frequencia === quantity}
              onClick={() => setFrequencia(quantity)}
            >
              {quantity}x
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        className="primary-button"
        onClick={handleSalvar}
        disabled={salvando || carregandoObjetivos || !!erroObjetivos || objetivos.length === 0}
      >
        {salvando ? 'SALVANDO PREFERÊNCIAS...' : 'SALVAR E VER MEU TREINO'}
      </button>
    </div>
  );
}

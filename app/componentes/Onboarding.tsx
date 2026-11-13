'use client';

import { useEffect, useRef, useState } from 'react';
import { apiService } from '../services/api';
import type { Objetivo, WorkoutFocus } from '../services/api';
import type { SetTela, SetUsuario, Usuario } from '../page';

const focusOptionsByObjective: Record<number, { value: WorkoutFocus; label: string; description: string }[]> = {
  1: [
    { value: 'superiores', label: 'Membros superiores', description: 'Prioriza peito, costas, braços e abdômen.' },
    { value: 'inferiores', label: 'Membros inferiores', description: 'Prioriza pernas, glúteos e panturrilhas.' },
  ],
  2: [
    { value: 'superiores', label: 'Membros superiores', description: 'Prioriza peito, costas, braços e abdômen.' },
    { value: 'inferiores', label: 'Membros inferiores', description: 'Prioriza pernas, glúteos e panturrilhas.' },
    { value: 'abdomen-core', label: 'Abdômen e core', description: 'Inclui estabilidade e trabalho de core.' },
    { value: 'corpo-inteiro', label: 'Corpo inteiro', description: 'Alterna os quatro grupos de treino ao longo da semana.' },
  ],
};

function getDefaultFocus(objectiveId: number): WorkoutFocus {
  return objectiveId === 1 ? 'superiores' : objectiveId === 2 ? 'abdomen-core' : 'corpo-inteiro';
}

type OnboardingStep = 'objective' | 'focus' | 'frequency';

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
    focusOptionsByObjective[user.objetivo_id ?? -1]?.some(
      (option) => option.value === user.foco_treino,
    )
      ? user.foco_treino as WorkoutFocus
      : user.objetivo_id
        ? getDefaultFocus(user.objetivo_id)
        : 'corpo-inteiro',
  );
  const [frequencia, setFrequencia] = useState(
    Math.min(Math.max(user.frequencia_semanal ?? 3, 3), 7),
  );
  const [etapa, setEtapa] = useState<OnboardingStep>(() =>
    user.objetivo_id
      ? focusOptionsByObjective[user.objetivo_id]?.length
        ? 'focus'
        : 'frequency'
      : 'objective',
  );
  const [salvando, setSalvando] = useState(false);
  const [objetivos, setObjetivos] = useState<Objetivo[]>([]);
  const [carregandoObjetivos, setCarregandoObjetivos] = useState(true);
  const [erroObjetivos, setErroObjetivos] = useState('');
  const [tentativa, setTentativa] = useState(0);
  const etapaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (etapa !== 'objective') {
      etapaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [etapa]);

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
  const focusQuestion =
    objetivoSelecionado === 1
      ? 'Qual região você quer priorizar para ganhar massa muscular?'
      : 'Qual é sua principal zona de foco para tonificação ou gasto calórico?';

  return (
    <div className="onboarding-panel">
      <div className="section-heading">
        <p className="eyebrow">Personalize seu plano</p>
        <h1 className="section-title">
          {etapa === 'objective'
            ? `Qual é o seu objetivo, ${user.nome.split(' ')[0]}?`
            : etapa === 'focus'
              ? focusQuestion
              : 'Quantos dias por semana você pretende treinar?'}
        </h1>
        <p className="section-copy">
          {etapa === 'objective'
            ? 'Escolha seu objetivo para continuar.'
            : etapa === 'focus'
              ? 'Agora escolha a região que deseja priorizar.'
              : 'Escolha uma frequência entre 3 dias e todos os dias.'}
        </p>
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
      {etapa === 'objective' && (
        <div ref={etapaRef} className="onboarding-stage">
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
                  setEtapa(
                    focusOptionsByObjective[item.id]?.length ? 'focus' : 'frequency',
                  );
                }}
              >
                <h2 className="goal-title">{item.titulo}</h2>
                <p className="goal-description">{item.descricao}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {etapa === 'focus' && (
        <div ref={etapaRef} className="onboarding-stage">
          <div className="goal-grid">
            {focusOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className="goal-option"
                aria-pressed={focoSelecionado === option.value}
                onClick={() => {
                  setFocoSelecionado(option.value);
                  setEtapa('frequency');
                }}
              >
                <h2 className="goal-title">{option.label}</h2>
                <p className="goal-description">{option.description}</p>
              </button>
            ))}
          </div>
          <button
            type="button"
            className="link-button"
            onClick={() => setEtapa('objective')}
          >
            Voltar para escolher o objetivo
          </button>
        </div>
      )}

      {etapa === 'frequency' && (
        <div ref={etapaRef} className="onboarding-stage">
          <div className="frequency-section">
            <div className="frequency-row">
              {[3, 4, 5, 6, 7].map((quantity) => (
                <button
                  key={quantity}
                  type="button"
                  className="frequency-option"
                  aria-pressed={frequencia === quantity}
                  onClick={() => setFrequencia(quantity)}
                >
                  {quantity === 7 ? 'Todo dia' : `${quantity}x`}
                </button>
              ))}
            </div>
            <p className="section-copy">
              Os grupos alternam para permitir recuperação entre estímulos semelhantes.
              Com 3 dias e foco em superiores, o plano inclui frente, costas e um treino
              de inferiores alternado entre frente e trás.
            </p>
          </div>
          <button
            type="button"
            className="link-button"
            onClick={() => setEtapa(focusOptions.length ? 'focus' : 'objective')}
          >
            {focusOptions.length ? 'Voltar para alterar o foco' : 'Voltar para o objetivo'}
          </button>
          <button
            type="button"
            className="primary-button"
            onClick={handleSalvar}
            disabled={salvando || carregandoObjetivos || !!erroObjetivos || objetivos.length === 0}
          >
            {salvando ? 'SALVANDO PREFERÊNCIAS...' : 'SALVAR E VER MEU TREINO'}
          </button>
        </div>
      )}
    </div>
  );
}

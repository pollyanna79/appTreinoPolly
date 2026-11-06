'use client';

import { useEffect, useState } from 'react';
import { apiService } from '../services/api';
import type { PlanoAlimentar } from '../services/api';
import type { SetTela, SetUsuario, Usuario } from '../page';

export default function Alimentacao({
  user,
  setTela,
  setUser,
}: {
  user: Usuario;
  setTela: SetTela;
  setUser: SetUsuario;
}) {
  const [plano, setPlano] = useState<PlanoAlimentar | null>(null);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let active = true;

    apiService
      .carregarAlimentacao(user.id)
      .then((data) => {
        if (active) {
          setPlano(data);
          setErro('');
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setErro(
            error instanceof Error
              ? error.message
              : 'Não foi possível carregar o menu alimentar do banco de dados.',
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
  }, [user.id]);

  return (
    <div className="workout-page food-page">
      <div className="food-heading">
        <div>
          <p className="eyebrow">Menu salvo no banco de dados</p>
          <h1 className="workout-title">Alimentação</h1>
          <p className="workout-subtitle">
            Sugestões gerais alinhadas ao seu objetivo salvo.
          </p>
        </div>
        <button
          type="button"
          className="secondary-button"
          onClick={() => setTela('treino')}
        >
          Voltar ao treino
        </button>
      </div>

      {carregando && (
        <div className="workout-state" role="status">
          <p className="eyebrow">Preparando seu menu</p>
          <h2 className="section-title">Carregando sugestões...</h2>
        </div>
      )}

      {!carregando && erro && (
        <div className="workout-state">
          <h2 className="section-title">Não foi possível abrir o menu.</h2>
          <p className="section-copy" role="alert">{erro}</p>
          <button
            type="button"
            className="secondary-button"
            onClick={() => setTela('onboarding')}
          >
            Escolher objetivo
          </button>
        </div>
      )}

      {plano && (
        <>
          <section className="nutrition-focus">
            <p className="eyebrow">Estratégia para {plano.objetivo}</p>
            <p>{plano.orientacaoObjetivo}</p>
          </section>
          <div className="food-summary">
            <span>Estimativa do menu de referência</span>
            <strong>~{plano.caloriasAproximadas} kcal</strong>
          </div>
          <div className="meal-list">
            {plano.refeicoes.map((meal) => (
              <article key={meal.id} className="meal-card">
                <div className="meal-card-heading">
                  <h2>{meal.refeicao}</h2>
                  {meal.calorias_aprox !== null && (
                    <span>{meal.calorias_aprox} kcal aprox.</span>
                  )}
                </div>
                <p className="meal-description">{meal.descricao}</p>
                <div className="meal-options">
                  {meal.opcoes.map((option) => (
                    <div className="meal-option" key={option.nivel}>
                      <span className="meal-option-icon" aria-hidden="true">{option.icone}</span>
                      <div>
                        <span className="meal-option-level">{option.nivel}</span>
                        <h3>{option.titulo}</h3>
                        <p>{option.descricao}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
          <p className="food-disclaimer">{plano.observacao}</p>
        </>
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

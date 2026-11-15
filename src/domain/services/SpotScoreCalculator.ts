import { Spot } from '../models/Spot';
import { MarineConditions, isDirectionInRange } from '../models/MarineConditions';
import { SpotScore, ConditionQuality } from '../models/SpotScore';

const FLAT_THRESHOLD_M = 0.5;
/** Highest score a flat sea can reach ("flat" quality band). */
const FLAT_SCORE_CAP = 25;
/** Highest score when swell is below the spot's minimum ("fair" at best). */
const UNDERSIZED_SCORE_CAP = 58;

export class SpotScoreCalculator {
  /**
   * Calculates a 0-100 score and qualitative breakdown for a spot under given marine conditions.
   */
  public static calculate(spot: Spot, conditions: MarineConditions): SpotScore {
    const pros: string[] = [];
    const cons: string[] = [];

    const swell = conditions.primarySwell;
    const wind = conditions.wind;
    const ideal = spot.idealConditions;

    // 1. Swell Height & Direction Score (max 40 pts)
    // Without enough swell, glassy wind or long period cannot make the spot good:
    // the overall score is capped so a flat sea never ranks as surfable.
    const isFlat = swell.heightM < FLAT_THRESHOLD_M;
    const isUndersized = !isFlat && swell.heightM < ideal.minSwellHeightM;
    let swellScore = 0;
    if (isFlat) {
      cons.push(`Mar casi plato (< ${FLAT_THRESHOLD_M}m)`);
      swellScore = 5;
    } else if (isUndersized) {
      cons.push(`Swell algo escaso (${swell.heightM.toFixed(1)}m, mínimo ideal ${ideal.minSwellHeightM}m)`);
      swellScore = 15;
    } else if (swell.heightM > ideal.maxSwellHeightM) {
      cons.push(`Swell desfasado para este spot (${swell.heightM.toFixed(1)}m, máx ideal ${ideal.maxSwellHeightM}m)`);
      swellScore = 12;
    } else {
      // In range: 25 base points
      swellScore = 25;
      pros.push(`Altura de ola ideal (${swell.heightM.toFixed(1)}m)`);
    }

    // Direction check
    const isSwellOptimal = isDirectionInRange(
      swell.directionDeg,
      ideal.optimalSwellDegrees.min,
      ideal.optimalSwellDegrees.max
    );

    if (isFlat) {
      // Direction is irrelevant when there is no swell to speak of
    } else if (isSwellOptimal) {
      swellScore += 15;
      pros.push(`Dirección de swell alineada (${swell.compassDir})`);
    } else {
      cons.push(`Swell cruzado / no entra limpio (${swell.compassDir})`);
    }

    // 2. Wind Score (max 35 pts)
    let windScore = 0;
    const isWindOffshore = isDirectionInRange(
      wind.directionDeg,
      ideal.favorableWindDegrees.min,
      ideal.favorableWindDegrees.max
    );

    if (wind.speedKmh <= 8) {
      windScore = 35;
      pros.push(`Mar plato / Vidrio (Viento flojo ${Math.round(wind.speedKmh)} km/h)`);
    } else if (isWindOffshore) {
      if (wind.speedKmh <= ideal.maxFavorableWindKmh) {
        windScore = 35;
        pros.push(`Viento terral perfecto / Offshore (${Math.round(wind.speedKmh)} km/h ${wind.compassDir})`);
      } else {
        windScore = 22;
        cons.push(`Terral demasiado fuerte (${Math.round(wind.speedKmh)} km/h)`);
      }
    } else {
      // Onshore or cross-onshore
      if (wind.speedKmh > 28) {
        windScore = 0;
        cons.push(`Onshore deshecho / Chopi fuerte (${Math.round(wind.speedKmh)} km/h ${wind.compassDir})`);
      } else if (wind.speedKmh > 18) {
        windScore = 10;
        cons.push(`Viento incómodo onshore (${Math.round(wind.speedKmh)} km/h)`);
      } else {
        windScore = 20;
        pros.push(`Viento flojo tolerable (${Math.round(wind.speedKmh)} km/h)`);
      }
    }

    // 3. Period Score (max 25 pts)
    let periodScore = 0;
    const period = swell.peakPeriodSec || swell.periodSec;

    if (period >= 14) {
      periodScore = 25;
      pros.push(`Periodo oceánico brutal (${period.toFixed(0)}s) - Mucha fuerza`);
    } else if (period >= ideal.minPeriodSec) {
      periodScore = 20;
      pros.push(`Buen periodo (${period.toFixed(0)}s)`);
    } else if (period >= 8) {
      periodScore = 12;
      cons.push(`Periodo justo (${period.toFixed(0)}s)`);
    } else {
      periodScore = 4;
      cons.push(`Periodo muy corto / Mar de viento (${period.toFixed(0)}s)`);
    }

    let overallScore = Math.min(100, Math.max(0, swellScore + windScore + periodScore));
    if (isFlat) overallScore = Math.min(overallScore, FLAT_SCORE_CAP);
    else if (isUndersized) overallScore = Math.min(overallScore, UNDERSIZED_SCORE_CAP);

    let quality: ConditionQuality = 'poor';
    if (overallScore >= 82) quality = 'firing';
    else if (overallScore >= 68) quality = 'good';
    else if (overallScore >= 50) quality = 'fair';
    else if (overallScore >= 30) quality = 'poor';
    else quality = 'flat';

    let recommendation = '';
    switch (quality) {
      case 'firing':
        recommendation = '¡Condiciones épicas! Spot en su mejor momento.';
        break;
      case 'good':
        recommendation = 'Muy buena opción para entrar hoy.';
        break;
      case 'fair':
        recommendation = 'Olas surfeables, aunque no ideales.';
        break;
      case 'poor':
        recommendation = 'Condiciones difíciles, viento o swell cruzado.';
        break;
      case 'flat':
        recommendation = 'Sin olas o completamente desfasado.';
        break;
    }

    return {
      spotId: spot.id,
      overallScore,
      quality,
      swellScore,
      windScore,
      periodScore,
      pros,
      cons,
      recommendation,
    };
  }
}

import { ClimatologyRepository } from '@/domain/ports/ClimatologyRepository';
import { SpotClimatology, MonthlyConsistency } from '@/domain/models/SeasonalClimatology';

const MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

function buildConsistency(percentages: number[], heights: number[], periods: number[]): MonthlyConsistency[] {
  return MONTH_NAMES.map((name, index) => ({
    month: index + 1,
    monthName: name,
    consistencyPct: percentages[index] ?? 50,
    averageWaveHeightM: heights[index] ?? 1.5,
    averagePeriodSec: periods[index] ?? 11,
  }));
}

const STATIC_CLIMATOLOGIES: Record<string, SpotClimatology> = {
  // LAS PALMAS
  'la-cicer': {
    spotId: 'la-cicer',
    bestSeason: 'autumn',
    bestSeasonLabel: 'Otoño - Invierno (Octubre a Marzo)',
    seasonSummary:
      'Fondo de arena volcánica sumamente consistente. La mejor época es el otoño por las "calmas canarias" con vientos terrales (offshore) y swells limpios del NW.',
    monthlyConsistency: buildConsistency(
      [85, 80, 75, 65, 55, 45, 40, 45, 70, 85, 90, 88],
      [1.8, 1.7, 1.6, 1.4, 1.2, 1.0, 0.9, 1.0, 1.3, 1.6, 1.9, 1.9],
      [13, 13, 12, 11, 10, 9, 9, 10, 12, 13, 14, 14]
    ),
    optimalSwellWindow: 'NW - N (310° - 350°)',
    optimalWindRegime: 'S, SE, E (Offshore) o brisa calma < 12 km/h',
    bestTidePhase: 'mid',
    tideDescription: 'Media marea subiendo. En bajamar extrema puede quedar orillero rápido.',
    historicalNotes:
      'Con swells superiores a 2.5m y periodos de 15s+, La Cícer tiende a cerrar ("desfasarse"). En esos días, los picos protegidos de Los Muellitos o La Barra son la alternativa inteligente.',
    crowdFactor: 'high',
    riskFactors: ['Corrientes de retorno en El Cruce', 'Aglomeración en horas punta (17:00-19:00)'],
  },
  'el-confital': {
    spotId: 'el-confital',
    bestSeason: 'winter',
    bestSeasonLabel: 'Invierno (Noviembre a Febrero)',
    seasonSummary:
      'Considerada la mejor derecha de Europa. Una rompiente de clase mundial sobre laja volcánica plana con tubos rápidos y secos.',
    monthlyConsistency: buildConsistency(
      [75, 70, 60, 40, 20, 15, 10, 15, 45, 65, 80, 80],
      [2.4, 2.2, 2.0, 1.6, 1.2, 1.0, 0.9, 1.0, 1.4, 1.8, 2.3, 2.5],
      [15, 14, 13, 11, 10, 9, 9, 10, 12, 14, 15, 15]
    ),
    optimalSwellWindow: 'WNW - NNW (290° - 340°), > 1.8m',
    optimalWindRegime: 'S, SE, ESE (Offshore puro)',
    bestTidePhase: 'low',
    tideDescription: 'Baja a media marea. En pleamar la ola pierde fuerza y rebota en el acantilado.',
    historicalNotes:
      'Requiere swell de Atlántico Norte con periodo alto (14-17s). Con viento Sur/Sureste y 2.5m es épico nivel Hawaii. Muy exigente técnica y físicamente.',
    crowdFactor: 'extreme',
    riskFactors: ['Fondo de roca volcánica afilada poco profunda', 'Localismo intenso en días grandes'],
  },
  'el-lloret': {
    spotId: 'el-lloret',
    bestSeason: 'winter',
    bestSeasonLabel: 'Invierno (Noviembre a Marzo)',
    seasonSummary:
      'Pico de derechas e izquierdas sobre lecho de cantos rodados. Aguanta muchísimo mar y funciona cuando otros spots del norte están desfasados.',
    monthlyConsistency: buildConsistency(
      [80, 75, 70, 50, 30, 20, 15, 20, 50, 70, 85, 85],
      [2.2, 2.0, 1.8, 1.5, 1.2, 1.0, 0.9, 1.0, 1.4, 1.7, 2.1, 2.3],
      [14, 13, 12, 11, 10, 9, 9, 10, 12, 13, 14, 14]
    ),
    optimalSwellWindow: 'N - NNE (340° - 25°)',
    optimalWindRegime: 'S, SW (Offshore)',
    bestTidePhase: 'mid',
    tideDescription: 'Media marea. Funciona en todo punto de marea si hay suficiente masa de agua.',
    historicalNotes:
      'Entrada y salida por cantos rodados resbaladizos con erizos. Ola potente y con mucha masa de agua.',
    crowdFactor: 'high',
    riskFactors: ['Piedras rodantes en la orilla', 'Fuerte corriente hacia la punta'],
  },
  'la-barra': {
    spotId: 'la-barra',
    bestSeason: 'winter',
    bestSeasonLabel: 'Invierno (Diciembre a Febrero)',
    seasonSummary:
      'Arrecife natural que protege la bahía de Las Canteras. Solo despierta con grandes temporales del Norte que rompen sobre la cresta exterior.',
    monthlyConsistency: buildConsistency(
      [50, 45, 35, 20, 10, 5, 5, 5, 20, 35, 55, 55],
      [2.5, 2.3, 2.0, 1.5, 1.0, 0.8, 0.8, 0.8, 1.2, 1.6, 2.2, 2.4],
      [15, 14, 13, 11, 10, 9, 9, 9, 11, 13, 15, 15]
    ),
    optimalSwellWindow: 'NNW - NNE (330° - 20°), > 2.2m',
    optimalWindRegime: 'S, SE, E (Offshore)',
    bestTidePhase: 'high',
    tideDescription: 'Pleamar obligatoria para no tocar el arrecife emergente.',
    historicalNotes: 'Ola tubular y rápida sobre coral fósil. Remada larga de 300m desde la playa.',
    crowdFactor: 'medium',
    riskFactors: ['Poco fondo sobre arrecife fósil', 'Distancia a la orilla'],
  },
  'los-muellitos': {
    spotId: 'los-muellitos',
    bestSeason: 'winter',
    bestSeasonLabel: 'Otoño - Invierno (Noviembre a Febrero)',
    seasonSummary:
      'Spot ubicado al abrigo del espigón del Auditorio Alfredo Kraus. Filtra el mar cuando La Cícer se desfasa por exceso de swell.',
    monthlyConsistency: buildConsistency(
      [75, 70, 65, 50, 35, 25, 20, 25, 55, 75, 80, 80],
      [1.7, 1.6, 1.5, 1.3, 1.0, 0.8, 0.8, 0.9, 1.2, 1.5, 1.8, 1.8],
      [13, 13, 12, 11, 10, 9, 9, 10, 12, 13, 14, 14]
    ),
    optimalSwellWindow: 'NW - N (310° - 350°)',
    optimalWindRegime: 'S, SE (Offshore)',
    bestTidePhase: 'mid',
    tideDescription: 'Baja a media marea.',
    historicalNotes:
      'Produce una izquierda muy noble y una derecha más técnica contra el muelle. El mejor refugio de Las Palmas en días de borrasca atlántica.',
    crowdFactor: 'medium',
    riskFactors: ['Proximidad a las piedras del espigón'],
  },

  // COSTA NORTE
  'el-fronton': {
    spotId: 'el-fronton',
    bestSeason: 'winter',
    bestSeasonLabel: 'Otoño - Invierno (Octubre a Marzo)',
    seasonSummary:
      'La meca mundial del bodyboard extremo. Rompe sobre arrecife volcánico en forma de herradura con secciones de doble tubo y rampas de proyección astronómicas.',
    monthlyConsistency: buildConsistency(
      [85, 80, 75, 60, 40, 25, 20, 25, 65, 85, 90, 90],
      [2.8, 2.6, 2.3, 1.8, 1.4, 1.1, 1.0, 1.1, 1.6, 2.1, 2.7, 2.9],
      [15, 15, 14, 12, 11, 9, 9, 10, 13, 15, 16, 16]
    ),
    optimalSwellWindow: 'NW - NNW (310° - 340°), 2.0m - 4.5m',
    optimalWindRegime: 'S, SE, SSE (Offshore)',
    bestTidePhase: 'mid',
    tideDescription: 'Media marea. En bajamar laja seca mortal; en pleamar rebote violento.',
    historicalNotes:
      'Poco fondo, corrientes brutales y labio pesado como hormigón. Solo para deportistas muy expertos. Sede del IBC World Bodyboard Tour.',
    crowdFactor: 'extreme',
    riskFactors: ['Caída sobre arrecife seco', 'Corrientes de succión hacia la cueva', 'Localismo riguroso'],
  },
  'san-felipe': {
    spotId: 'san-felipe',
    bestSeason: 'autumn',
    bestSeasonLabel: 'Otoño - Invierno (Octubre a Febrero)',
    seasonSummary:
      'Playa abierta en Santa María de Guía con fondo de arena negra y cantos. Muy expuesta a cualquier pulso atlántico.',
    monthlyConsistency: buildConsistency(
      [80, 75, 70, 60, 45, 30, 25, 30, 65, 80, 85, 85],
      [2.0, 1.9, 1.7, 1.5, 1.2, 1.0, 0.9, 1.0, 1.4, 1.7, 2.1, 2.1],
      [14, 13, 12, 11, 10, 9, 9, 10, 12, 13, 14, 14]
    ),
    optimalSwellWindow: 'WNW - N (300° - 360°)',
    optimalWindRegime: 'S, SSE (Offshore)',
    bestTidePhase: 'mid',
    tideDescription: 'Baja a media marea.',
    historicalNotes:
      'Picos de izquierda y derecha muy maniobrables. Entorno salvaje con olas consistentes durante todo el invierno.',
    crowdFactor: 'medium',
    riskFactors: ['Fuerte corriente mar adentro', 'Orilla pedregosa'],
  },
  'quintanilla': {
    spotId: 'quintanilla',
    bestSeason: 'winter',
    bestSeasonLabel: 'Invierno (Noviembre a Febrero)',
    seasonSummary:
      'Varios picos de roca volcánica (El Paso, Quintanilla). Derechas largas y potentes con secciones huecas.',
    monthlyConsistency: buildConsistency(
      [80, 75, 70, 55, 35, 20, 15, 20, 55, 75, 85, 85],
      [2.2, 2.0, 1.8, 1.5, 1.2, 1.0, 0.9, 1.0, 1.4, 1.8, 2.2, 2.3],
      [14, 13, 12, 11, 10, 9, 9, 10, 12, 14, 15, 15]
    ),
    optimalSwellWindow: 'WNW - N (295° - 350°)',
    optimalWindRegime: 'S, SE (Offshore)',
    bestTidePhase: 'mid',
    tideDescription: 'Media marea subiendo.',
    historicalNotes: 'Uno de los point breaks clásicos del norte de Gran Canaria.',
    crowdFactor: 'high',
    riskFactors: ['Erizos en el fondo de roca', 'Entrada/salida técnica por las rocas'],
  },
  'el-agujero': {
    spotId: 'el-agujero',
    bestSeason: 'winter',
    bestSeasonLabel: 'Otoño - Invierno (Octubre a Febrero)',
    seasonSummary:
      'Arrecife volcánico contiguo a las piscinas naturales de Gáldar. Izquierdas y derechas intensas.',
    monthlyConsistency: buildConsistency(
      [75, 70, 65, 50, 30, 20, 15, 20, 55, 75, 80, 80],
      [2.1, 1.9, 1.7, 1.4, 1.1, 0.9, 0.9, 1.0, 1.3, 1.7, 2.1, 2.2],
      [14, 13, 12, 11, 10, 9, 9, 10, 12, 13, 14, 14]
    ),
    optimalSwellWindow: 'NW - N (310° - 350°)',
    optimalWindRegime: 'S, SE (Offshore)',
    bestTidePhase: 'mid',
    tideDescription: 'Baja a media subiendo.',
    historicalNotes: 'Excelente para surf y bodyboard con olas huecas.',
    crowdFactor: 'medium',
    riskFactors: ['Arrecife con poca profundidad en el inside'],
  },
  'banaderos': {
    spotId: 'banaderos',
    bestSeason: 'winter',
    bestSeasonLabel: 'Invierno (Noviembre a Enero)',
    seasonSummary:
      'Picos sobre roca volcánica en Arucas. Produce derechas rápidas con fuerza.',
    monthlyConsistency: buildConsistency(
      [75, 70, 65, 50, 30, 20, 15, 20, 50, 70, 80, 80],
      [2.0, 1.8, 1.6, 1.3, 1.1, 0.9, 0.8, 0.9, 1.3, 1.6, 2.0, 2.1],
      [14, 13, 12, 11, 10, 9, 9, 10, 12, 13, 14, 14]
    ),
    optimalSwellWindow: 'NNW - N (330° - 10°)',
    optimalWindRegime: 'S, SW (Offshore)',
    bestTidePhase: 'all',
    tideDescription: 'Funciona en casi cualquier marea.',
    historicalNotes: 'Spot accesible con acceso directo desde el paseo marítimo.',
    crowdFactor: 'medium',
    riskFactors: ['Rocas resbaladizas'],
  },

  // TELDE / ESTE
  'playa-del-hombre': {
    spotId: 'playa-del-hombre',
    bestSeason: 'year-round',
    bestSeasonLabel: 'Todo el año (Especialmente Primavera - Verano con Alisios)',
    seasonSummary:
      'El spot más consistente de Gran Canaria. Al estar orientado al Este capta tanto los mares de viento generados por los Alisios como swells de refracción del norte y temporales de levante.',
    monthlyConsistency: buildConsistency(
      [70, 70, 75, 80, 85, 90, 92, 90, 80, 75, 70, 70],
      [1.4, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.7, 1.5, 1.4, 1.4, 1.4],
      [11, 10, 10, 9, 9, 8, 8, 8, 10, 11, 11, 11]
    ),
    optimalSwellWindow: 'NE - E - SE (45° - 120°)',
    optimalWindRegime: 'W, SW, NW (Offshore) o viento débil matutino',
    bestTidePhase: 'mid',
    tideDescription: 'Media marea subiendo a pleamar.',
    historicalNotes:
      'Cuando el norte de la isla está completamente plano en pleno verano, Playa del Hombre siempre tiene entre 1.0m y 1.6m de olas de viento.',
    crowdFactor: 'high',
    riskFactors: ['Corrientes laterales fuertes', 'Orillera potente en pleamar'],
  },
  'la-garita': {
    spotId: 'la-garita',
    bestSeason: 'autumn',
    bestSeasonLabel: 'Otoño - Invierno (Octubre a Febrero)',
    seasonSummary:
      'Playa de arena negra volcánica que aprovecha la entrada de swells del Este y refracciones potentes de Norte.',
    monthlyConsistency: buildConsistency(
      [65, 60, 60, 55, 60, 65, 70, 65, 65, 70, 70, 65],
      [1.3, 1.2, 1.3, 1.3, 1.4, 1.5, 1.5, 1.5, 1.3, 1.3, 1.4, 1.4],
      [11, 10, 10, 9, 9, 8, 8, 8, 10, 11, 11, 11]
    ),
    optimalSwellWindow: 'ENE - ESE (60° - 110°)',
    optimalWindRegime: 'W, WSW (Offshore)',
    bestTidePhase: 'mid',
    tideDescription: 'Baja a media marea.',
    historicalNotes: 'Cerca del Bufadero de La Garita, picos divertidos de derecha e izquierda.',
    crowdFactor: 'medium',
    riskFactors: ['Fuerte corriente cerca del espigón natural'],
  },
  'ojos-de-garza': {
    spotId: 'ojos-de-garza',
    bestSeason: 'summer',
    bestSeasonLabel: 'Primavera - Verano (Mayo a Septiembre)',
    seasonSummary:
      'Ensenada protegida junto al aeropuerto de Gran Canaria. Funciona con swells de viento del Este.',
    monthlyConsistency: buildConsistency(
      [40, 40, 45, 55, 65, 75, 80, 75, 60, 50, 45, 40],
      [1.1, 1.0, 1.1, 1.2, 1.4, 1.5, 1.6, 1.5, 1.3, 1.2, 1.1, 1.1],
      [10, 9, 9, 9, 8, 8, 8, 8, 9, 10, 10, 10]
    ),
    optimalSwellWindow: 'ENE - E (65° - 95°)',
    optimalWindRegime: 'W, NW (Offshore)',
    bestTidePhase: 'mid',
    tideDescription: 'Media marea.',
    historicalNotes: 'Spot muy resguardado, ideal para días de fuerte Alisio con olas amables.',
    crowdFactor: 'low',
    riskFactors: ['Piedras y casas tradicionales cerca de la orilla'],
  },
  'playa-de-melenara': {
    spotId: 'playa-de-melenara',
    bestSeason: 'autumn',
    bestSeasonLabel: 'Otoño (Septiembre a Noviembre)',
    seasonSummary:
      'Playa familiar que genera picos nobles de arena con temporales de levante.',
    monthlyConsistency: buildConsistency(
      [45, 40, 40, 40, 50, 55, 60, 55, 60, 65, 55, 50],
      [1.1, 1.0, 1.0, 1.1, 1.2, 1.3, 1.4, 1.3, 1.2, 1.2, 1.2, 1.1],
      [10, 9, 9, 8, 8, 8, 8, 8, 9, 10, 10, 10]
    ),
    optimalSwellWindow: 'E - SE (80° - 130°)',
    optimalWindRegime: 'W, WNW (Offshore)',
    bestTidePhase: 'mid',
    tideDescription: 'Media a pleamar.',
    historicalNotes: 'Olas suaves y progresivas aptas para longboard y progresión.',
    crowdFactor: 'low',
    riskFactors: ['Bañistas en temporada estival'],
  },
  'mosca-point': {
    spotId: 'mosca-point',
    bestSeason: 'summer',
    bestSeasonLabel: 'Verano (Junio a Agosto)',
    seasonSummary:
      'Bahía de Pozo Izquierdo. Una derecha potentísima sobre canto rodado que se levanta cuando el Alisio supera los 25 nudos.',
    monthlyConsistency: buildConsistency(
      [50, 55, 60, 70, 85, 95, 98, 95, 75, 60, 50, 45],
      [1.4, 1.3, 1.5, 1.7, 2.0, 2.2, 2.4, 2.3, 1.8, 1.5, 1.4, 1.3],
      [9, 9, 9, 8, 8, 7, 7, 7, 8, 9, 9, 9]
    ),
    optimalSwellWindow: 'NNE - E (30° - 90°)',
    optimalWindRegime: 'NNE, NE (Side-off / Side-on fuerte para windsurf/kitesurf)',
    bestTidePhase: 'high',
    tideDescription: 'Pleamar para cubrir los cantos rodados.',
    historicalNotes: 'Sede legendaria de la PWA World Cup de Windsurf. Vientos extremos de verano.',
    crowdFactor: 'high',
    riskFactors: ['Viento muy fuerte (> 50 km/h)', 'Cantos rodados en la orilla'],
  },

  // SUR / SURESTE
  'maspalomas': {
    spotId: 'maspalomas',
    bestSeason: 'summer',
    bestSeasonLabel: 'Verano e Invierno con temporales del Sur (Julio - Agosto / Dic - Feb)',
    seasonSummary:
      'La derecha del Faro de Maspalomas. Una de las olas más largas y perfectas de Canarias cuando un swell del Hemisferio Sur o una borrasca del SW entra con viento Alisio (que aquí sopla offshore perfecto).',
    monthlyConsistency: buildConsistency(
      [45, 40, 30, 25, 40, 60, 70, 70, 50, 35, 40, 50],
      [1.5, 1.4, 1.1, 1.0, 1.2, 1.5, 1.6, 1.6, 1.3, 1.1, 1.3, 1.5],
      [13, 13, 11, 10, 12, 13, 14, 14, 12, 11, 13, 13]
    ),
    optimalSwellWindow: 'SSW - S - SSE (190° - 215°)',
    optimalWindRegime: 'N, NE (Offshore perfecto por los Alisios)',
    bestTidePhase: 'low',
    tideDescription: 'Baja a media marea.',
    historicalNotes:
      'El contraste es espectacular: mientras el norte está castigado por viento o plano, Maspalomas puede ofrecer tubos cristalinos con agua turquesa.',
    crowdFactor: 'high',
    riskFactors: ['Corriente de punta hacia mar abierto', 'Piedras en la orilla del faro'],
  },
  'playa-del-ingles': {
    spotId: 'playa-del-ingles',
    bestSeason: 'summer',
    bestSeasonLabel: 'Verano (Junio a Septiembre)',
    seasonSummary:
      'Bancos de arena frente a las dunas de Maspalomas. Olas divertidas y nobles con swells de sur.',
    monthlyConsistency: buildConsistency(
      [35, 30, 25, 20, 35, 55, 65, 65, 45, 30, 35, 40],
      [1.2, 1.1, 0.9, 0.8, 1.0, 1.3, 1.4, 1.4, 1.1, 0.9, 1.1, 1.2],
      [12, 12, 10, 9, 11, 13, 13, 13, 11, 10, 12, 12]
    ),
    optimalSwellWindow: 'S - SE (170° - 140°)',
    optimalWindRegime: 'N, NNE (Offshore)',
    bestTidePhase: 'mid',
    tideDescription: 'Media marea.',
    historicalNotes: 'Excelente para surf recreativo y longboard con clima cálido permanente.',
    crowdFactor: 'medium',
    riskFactors: ['Bañistas en la orilla'],
  },
  'arguineguin': {
    spotId: 'arguineguin',
    bestSeason: 'winter',
    bestSeasonLabel: 'Invierno (Diciembre a Febrero con SW)',
    seasonSummary:
      'La mítica derecha de la fábrica de cemento en Mogán. Rompe solo cuando borrascas del Suroeste golpean el archipiélago.',
    monthlyConsistency: buildConsistency(
      [40, 35, 20, 15, 10, 10, 15, 15, 20, 25, 35, 45],
      [1.8, 1.6, 1.2, 1.0, 0.8, 0.8, 0.9, 0.9, 1.0, 1.2, 1.5, 1.9],
      [13, 13, 11, 10, 9, 9, 10, 10, 11, 12, 13, 14]
    ),
    optimalSwellWindow: 'SW - SSW (210° - 235°)',
    optimalWindRegime: 'NE, NNE (Offshore)',
    bestTidePhase: 'mid',
    tideDescription: 'Media marea.',
    historicalNotes:
      'Ola técnica de gran pared que conecta varias secciones a lo largo de la bahía.',
    crowdFactor: 'high',
    riskFactors: ['Fondo de piedras y erizos', 'Poco frecuente'],
  },
  'taurito': {
    spotId: 'taurito',
    bestSeason: 'winter',
    bestSeasonLabel: 'Invierno (Diciembre a Enero)',
    seasonSummary:
      'Cala encañonada en el suroeste de Mogán. Olas de fondo mixto activadas por mar de fondo de suroeste.',
    monthlyConsistency: buildConsistency(
      [35, 30, 20, 15, 10, 10, 15, 15, 15, 20, 30, 40],
      [1.5, 1.4, 1.1, 0.9, 0.8, 0.8, 0.9, 0.9, 1.0, 1.1, 1.3, 1.6],
      [12, 12, 10, 9, 9, 9, 10, 10, 10, 11, 12, 13]
    ),
    optimalSwellWindow: 'SSW - WSW (200° - 250°)',
    optimalWindRegime: 'NE, ENE (Offshore)',
    bestTidePhase: 'mid',
    tideDescription: 'Baja a media marea.',
    historicalNotes: 'Muy abrigada de los vientos dominantes.',
    crowdFactor: 'low',
    riskFactors: ['Acantilados cercanos'],
  },
  'pasito-blanco': {
    spotId: 'pasito-blanco',
    bestSeason: 'summer',
    bestSeasonLabel: 'Verano (Julio - Agosto)',
    seasonSummary:
      'Rompiente junto al dique del puerto deportivo de Pasito Blanco. Derecha corta pero con sección rápida.',
    monthlyConsistency: buildConsistency(
      [35, 30, 25, 20, 30, 50, 60, 60, 40, 25, 30, 35],
      [1.3, 1.2, 1.0, 0.9, 1.1, 1.3, 1.4, 1.4, 1.1, 1.0, 1.1, 1.3],
      [12, 12, 10, 9, 11, 12, 13, 13, 11, 10, 12, 12]
    ),
    optimalSwellWindow: 'S - SSW (180° - 210°)',
    optimalWindRegime: 'N, NE (Offshore)',
    bestTidePhase: 'mid',
    tideDescription: 'Media a pleamar.',
    historicalNotes: 'Excelente opción cuando Maspalomas está saturada.',
    crowdFactor: 'medium',
    riskFactors: ['Tráfico de embarcaciones cerca del canal'],
  },
};

export class StaticClimatologyRepository implements ClimatologyRepository {
  public async getClimatologyBySpotId(spotId: string): Promise<SpotClimatology | null> {
    return STATIC_CLIMATOLOGIES[spotId] ?? null;
  }

  public async getAllClimatologies(): Promise<SpotClimatology[]> {
    return Object.values(STATIC_CLIMATOLOGIES);
  }
}

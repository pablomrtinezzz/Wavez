# 🌊 Wavez — Gran Canaria Surf Radar & Webcams

**Wavez** es una plataforma web desarrollada para monitorizar en tiempo real y comparar las condiciones de surf en los mejores spots de Gran Canaria, combinando modelos oceanográficos de libre acceso, un índice de energía de ola, webcams oficiales embebidas y un sistema de fotos comunitarias verificadas (cámara en vivo y ubicación en el spot).

---

## 🚀 Características Principales

1. **Parte de olas editorial (20 spots en 4 zonas):** una sola página tranquila con el mejor spot del momento, sus cifras clave y secciones de *Spots*, *La isla* (mapa) y *Webcams*. Cada spot tiene un informe completo en un panel lateral enlazable (`/?spot=la-cicer`).
   * **Las Palmas:** La Cícer, El Confital, El Lloret, La Barra, Los Muellitos.
   * **Costa Norte:** El Frontón, El Agujero, San Felipe (Vagabundo), El Altillo, Quintanilla.
   * **Telde / Este:** Playa del Hombre, Ojos de Garza, La Garita, Playa de Silva, Melenara.
   * **Sur / Sureste:** Maspalomas (Punta/Faro), Arguineguín, Mosca Point, Playa del Inglés, Bahía Feliz.

2. **Datos reales a coste 0 (Open-Meteo, CC BY 4.0):**
   * Oleaje (altura, periodo, dirección), viento y rachas, **marea estimada** (`sea_level_height_msl`), **temperatura del agua** y **orto/ocaso**.
   * Línea temporal horaria de 15 días (−7 histórico / +7 previsión) en **hora canaria**, cacheada por spot (10 min) con deduplicación de peticiones.
   * Si Open-Meteo no devuelve datos, el spot se marca como *sin datos*: nunca se inventan valores.
   * Índice de energía en "kJ" calculado como `40·H²·T` (proporcional a la potencia de ola en aguas profundas).

3. **Nota de 0 a 10 por spot:** combina oleaje y dirección (40), viento terral/onshore (35) y periodo (25), con ajuste por **marea preferida** del spot. Un mar plano (< 0,5 m) o por debajo del mínimo del spot nunca puntúa como bueno.

4. **El día hora a hora:** gráfica de altura de ola con crosshair y lectura, noche sombreada, **mejor ventana** calculada como tramo continuo de horas de luz, tiras de calidad y viento, navegación por teclado y vista en tabla.

5. **Temporada:** consistencia mensual (% de días surfeables), ventana de swell y viento ideales, marea, ambiente, notas locales y precauciones.

6. **Webcams oficiales de In2theBeach** (10 cámaras) cargadas bajo demanda y restringidas a los dominios aprobados.

7. **Fotos de la comunidad con verificación en el sitio:** la foto solo se puede hacer en el momento con la cámara integrada en la web (sin acceso al carrete) y exige la ubicación del dispositivo, que debe estar a menos de 2,5 km del spot. Cliente y servidor aplican la misma regla; las imágenes se comprimen en el dispositivo y el envío está limitado por IP.

8. **Abierta al público:** sin registro ni clave.

9. **Marca:** logo en `public/brand/` (símbolo SVG, versiones horizontales clara y oscura e iconos PNG para PWA y redes).

---

## 🏛️ Arquitectura Hexagonal (Ports & Adapters)

El proyecto sigue una separación estricta de responsabilidades:

```
src/
├── domain/                      # Lógica pura de negocio y contratos (Zero deps)
│   ├── models/                  # Spot, MarineConditions, Tide, LocalTime, SpotScore, SpotReport...
│   ├── ports/                   # Interfaces (SpotRepository, MarineWeatherService, ClimatologyRepository...)
│   └── services/                # SpotScoreCalculator, ExifSecurityValidator
├── infrastructure/              # Adaptadores que implementan los puertos
│   ├── repositories/            # StaticSpotRepository, StaticClimatologyRepository
│   ├── adapters/                # OpenMeteoMarineAdapter, InMemorySpotReportRepository
│   └── http/                    # Rate limiting de endpoints públicos
├── application/                 # Casos de uso y orquestación
│   ├── dtos/                    # SpotSummaryDTO, SpotDetailDTO
│   ├── usecases/                # GetSpotsWithForecastUseCase, GetSpotDetailUseCase, SubmitSpotReportUseCase
│   └── container.ts             # Inyección de dependencias (Composition Root)
├── presentation/                # Interfaz de usuario
│   ├── components/site/         # Hero, TimeControl, SpotList, IslandMap, WebcamGallery, cabecera/pie
│   ├── components/spot/         # SpotDrawer (informe), WebcamEmbed, ReportDialog
│   ├── components/charts/       # DayChart, SeasonChart
│   └── lib/                     # Formato, etiquetas de calidad, cliente de API
└── app/                         # Página y endpoints (/api/spots, /api/reports)
```

---

## 🛠️ Tecnologías Empleadas

* **Framework:** Next.js 16 (App Router + React 19)
* **Lenguaje:** TypeScript 5 (tipado estricto)
* **Estilos:** Tailwind CSS 4 (tokens propios), Instrument Serif + Geist
* **Cámara y ubicación:** `getUserMedia` + Geolocation API + Canvas
* **Iconografía:** Lucide React
* **Testing:** Node.js native test runner con TypeScript (`npm test`)

---

## 📦 Instalación y Ejecución Local

1. **Clonar repositorio e instalar dependencias:**
   ```bash
   git clone <repo-url>
   cd wavez
   npm install
   ```

2. **Ejecutar tests unitarios y de adaptadores:**
   ```bash
   npm test
   ```

3. **Iniciar el servidor de desarrollo:**
   ```bash
   npm run dev
   ```
   Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

---

## 🌐 Despliegue a Coste 0

1. **Frontend y Backend Serverless:** Conectar el repositorio a [Vercel](https://vercel.com) o [Cloudflare Pages] (Free Tier).
2. **Base de Datos y Almacenamiento Permanente (Futuro):**
   * Configurar un proyecto gratuito en [Supabase](https://supabase.com) (PostgreSQL 500MB + Storage 1GB).
   * Los puertos `SpotReportRepository` y `SpotRepository` ya están preparados para intercambiar la implementación en memoria por Supabase con solo cambiar el adaptador en `src/application/container.ts`.

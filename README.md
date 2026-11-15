# 🌊 Wavez — Gran Canaria Surf Radar & Webcams

**Wavez** es una plataforma web desarrollada para monitorizar en tiempo real y comparar las condiciones de surf en los mejores spots de Gran Canaria, combinando modelos oceanográficos de libre acceso, mediciones de energía en kilojulios ($kJ$) de Surf-Forecast, webcams oficiales embebidas y un sistema de reportes comunitarios con verificación anti-trampas (EXIF y geolocalización GPS).

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
   * Energía en kJ de Surf-Forecast en directo (con caché de 1 h) o estimada como `40·H²·T` para otras horas.

3. **Nota de 0 a 10 por spot:** combina oleaje y dirección (40), viento terral/onshore (35) y periodo (25), con ajuste por **marea preferida** del spot. Un mar plano (< 0,5 m) o por debajo del mínimo del spot nunca puntúa como bueno.

4. **El día hora a hora:** gráfica de altura de ola con crosshair y lectura, noche sombreada, **mejor ventana** calculada como tramo continuo de horas de luz, tiras de calidad y viento, navegación por teclado y vista en tabla.

5. **Temporada:** consistencia mensual (% de días surfeables), ventana de swell y viento ideales, marea, ambiente, notas locales y precauciones.

6. **Webcams oficiales de In2theBeach** (10 cámaras) cargadas bajo demanda y restringidas a los dominios aprobados.

7. **Fotos de la comunidad con verificación:** EXIF (hora) y GPS (distancia al spot) comprobados con el mismo validador de dominio en cliente y servidor; compresión en el dispositivo; solo se aceptan imágenes JPEG/PNG/WebP de tamaño acotado.

8. **Acceso privado:** sesión firmada con HMAC (cookie HttpOnly, 30 días) y `proxy.ts` que exige sesión válida en toda la API.

---

## 🏛️ Arquitectura Hexagonal (Ports & Adapters)

El proyecto sigue una separación estricta de responsabilidades:

```
src/
├── domain/                      # Lógica pura de negocio y contratos (Zero deps)
│   ├── models/                  # Spot, MarineConditions, Tide, LocalTime, SpotScore, SpotReport...
│   ├── ports/                   # Interfaces (SpotRepository, MarineWeatherService, EnergyScraperService...)
│   └── services/                # SpotScoreCalculator, ExifSecurityValidator
├── infrastructure/              # Adaptadores que implementan los puertos
│   ├── repositories/            # StaticSpotRepository, StaticClimatologyRepository
│   ├── adapters/                # OpenMeteoMarineAdapter, SurfForecastScraperAdapter, InMemorySpotReportRepository
│   └── auth/                    # Sesión firmada (HMAC) para el acceso privado
├── application/                 # Casos de uso y orquestación
│   ├── dtos/                    # SpotSummaryDTO, SpotDetailDTO
│   ├── usecases/                # GetSpotsWithForecastUseCase, GetSpotDetailUseCase, SubmitSpotReportUseCase
│   └── container.ts             # Inyección de dependencias (Composition Root)
├── presentation/                # Interfaz de usuario
│   ├── components/site/         # Hero, TimeControl, SpotList, IslandMap, WebcamGallery, AccessGate, cabecera/pie
│   ├── components/spot/         # SpotDrawer (informe), WebcamEmbed, ReportDialog
│   ├── components/charts/       # DayChart, SeasonChart
│   └── lib/                     # Formato, etiquetas de calidad, cliente de API
├── app/                         # Página y endpoints (/api/spots, /api/reports, /api/auth)
└── proxy.ts                     # Exige sesión válida en /api/*
```

---

## 🛠️ Tecnologías Empleadas

* **Framework:** Next.js 16 (App Router + React 19)
* **Lenguaje:** TypeScript 5 (tipado estricto)
* **Estilos:** Tailwind CSS 4 (tokens propios), Instrument Serif + Geist
* **Scraping seguro:** Cheerio (con rate-limiting y caché)
* **Procesamiento de imágenes y EXIF:** `exifr` + Canvas API HTML5
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

4. **Acceso Privado:**
   * Clave por defecto **solo en desarrollo**: `grancanariasurf`.
   * En producción es obligatorio definir `APP_PASSKEY`; sin ella el login responde 503.
   * Opcional: `SESSION_SECRET` para firmar las sesiones con una clave distinta de la de acceso (cambiarla cierra todas las sesiones).

---

## 🌐 Despliegue a Coste 0

1. **Frontend y Backend Serverless:** Conectar el repositorio a [Vercel](https://vercel.com) o [Cloudflare Pages] (Free Tier).
2. **Base de Datos y Almacenamiento Permanente (Futuro):**
   * Configurar un proyecto gratuito en [Supabase](https://supabase.com) (PostgreSQL 500MB + Storage 1GB).
   * Los puertos `SpotReportRepository` y `SpotRepository` ya están preparados para intercambiar la implementación en memoria por Supabase con solo cambiar el adaptador en `src/application/container.ts`.

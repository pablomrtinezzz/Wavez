# 🌊 Wavez — Gran Canaria Surf Radar & Webcams

**Wavez** es una plataforma web desarrollada para monitorizar en tiempo real y comparar las condiciones de surf en los mejores spots de Gran Canaria, combinando modelos oceanográficos de libre acceso, mediciones de energía en kilojulios ($kJ$) de Surf-Forecast, webcams oficiales embebidas y un sistema de reportes comunitarios con verificación anti-trampas (EXIF y geolocalización GPS).

---

## 🚀 Características Principales

1. **Radar Inteligente de Spots (20 picos en 4 zonas de Gran Canaria):**
   * **Las Palmas:** La Cícer, El Confital, El Lloret, La Barra, Los Muellitos.
   * **Costa Norte:** El Frontón, El Agujero, San Felipe (Vagabundo), El Altillo, Quintanilla.
   * **Telde / Este:** Playa del Hombre, Ojos de Garza, La Garita, Playa de Silva, Melenara.
   * **Sur / Sureste:** Maspalomas (Punta/Faro), Arguineguín, Mosca Point, Playa del Inglés, Bahía Feliz.

2. **Fusión de Datos Meteorológicos a Coste 0 (€0/mes):**
   * **Open-Meteo Marine API:** Altura de mar de fondo (swell), periodo, dirección en grados y viento a 10m sin límite estricto ni claves de pago.
   * **Timeline Multidía Continuo (15 días):** Permite explorar tanto el **histórico reciente (-7 días)** como la **previsión a futuro (+7 días)** con resolución horaria continua.
   * **Scraper de Energía (kJ) de Surf-Forecast:** Extracción ligera y con caché en memoria (1h TTL) del dato clave de potencia marina y rating de estrellas, con fallback matemático automático.
   * **Algoritmo de Idoneidad (0 a 100):** Calcula la calidad en tiempo real (*Épico / Muy Bueno / Surfeable / Difícil / Plato*) contrastando las condiciones con los requerimientos óptimos de cada rompiente.

3. **Evolución Horaria y Simulación 24 Horas:**
   * **Timeline Scrubber Interactivo:** Deslizador de 00:00 a 23:00 con saltos rápidos a Amanecer (07:00), Mediodía (12:00), Atardecer (18:00) y botón de simulación automática continua ("Auto-Play").
   * **Gráfico de Spline 24h:** Curva SVG responsiva con altura de ola, energía, dirección de viento y cálculo automático de la **Ventana Óptima de Baño** diurna.

4. **Climatología Estacional e Inteligencia Oceanográfica de Gran Canaria:**
   * **Perfil Estacional de 20 Spots:** Serie histórica mensual (Ene a Dic) de consistencia surfeable (%), altura y periodos medios.
   * **Conocimiento Local Integrado:** Información detallada sobre cómo reacciona cada pico en Invierno (swells de NW/N), Verano (Alisios y swells de Sur), y Otoño (calmas canarias y terrales), mareas óptimas y factores de riesgo.

5. **Integración Legal y Precisa de Webcams Oficiales (10 Cams In2theBeach):**
   * Enlaces directos y streams verificados para La Cícer, Los Muellitos, La Barra, San Felipe, Playa del Hombre, La Garita, Mosca Point, Maspalomas, Arguineguín y Playa del Inglés con sandboxing y atribución legal.

6. **Fotos Comunitarias con Sistema Anti-Trampas:**
   * **Disparo directo con cámara móvil:** Uso de `capture="environment"` para certificar fotos recién tomadas sin posibilidad de subir fotos antiguas del carrete.
   * **Extracción de metadatos EXIF (`exifr`):** Análisis client-side de `DateTimeOriginal` (rechaza fotos de más de 3 horas o fechas futuras) y coordenadas GPS (validación por fórmula de Haversine dentro del radio del spot).
   * **Compresión en el navegador:** Reducción automática de imágenes a WebP/JPEG antes de subir para no saturar almacenamiento ni consumir datos móviles.

7. **Vistas Modulares Estilo Obsidian:**
   * Bento Grid, Mapa Radar Interactivo de la Isla, Muro de Vigilancia de Webcams y Matriz de Telemetría Compacta.

8. **Modo Privado Inicial:**
   * Pantalla de acceso por clave privada (Cookie segura HttpOnly) para que puedas utilizarlo individualmente antes de abrirlo a más usuarios.

---

## 🏛️ Arquitectura Hexagonal (Ports & Adapters)

El proyecto sigue una separación estricta de responsabilidades:

```
src/
├── domain/                      # Lógica pura de negocio y contratos (Zero deps)
│   ├── models/                  # Spot, MarineConditions, SurfForecastEnergy, SpotReport, SpotScore
│   ├── ports/                   # Interfaces (SpotRepository, MarineWeatherService, EnergyScraperService...)
│   └── services/                # SpotScoreCalculator, ExifSecurityValidator
├── infrastructure/              # Adaptadores que implementan los puertos
│   ├── repositories/            # StaticSpotRepository (Configuración de los 20 spots de GC)
│   └── adapters/                # OpenMeteoMarineAdapter, SurfForecastScraperAdapter, InMemorySpotReportRepository
├── application/                 # Casos de uso y orquestación
│   ├── dtos/                    # SpotSummaryDTO, SpotDetailDTO
│   ├── usecases/                # GetSpotsWithForecastUseCase, GetSpotDetailUseCase, SubmitSpotReportUseCase
│   └── container.ts             # Inyección de dependencias (Composition Root)
└── presentation/                # Interfaz de usuario (Next.js 16 App Router)
    ├── components/              # Navbar, ZoneSelector, SpotCard, WebcamViewer, SpotDetailModal, CameraUploadModal
    └── app/                     # Rutas de página y API Endpoints (/api/spots, /api/reports, /api/auth)
```

---

## 🛠️ Tecnologías Empleadas

* **Framework:** Next.js 16 (App Router + React 19)
* **Lenguaje:** TypeScript 5 (tipado estricto)
* **Estilos:** Tailwind CSS 4
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
   * Clave por defecto en desarrollo: `grancanariasurf`
   * Puedes cambiarla definiendo la variable de entorno `APP_PASSKEY=tu_clave_secreta` en `.env.local`.

---

## 🌐 Despliegue a Coste 0

1. **Frontend y Backend Serverless:** Conectar el repositorio a [Vercel](https://vercel.com) o [Cloudflare Pages] (Free Tier).
2. **Base de Datos y Almacenamiento Permanente (Futuro):**
   * Configurar un proyecto gratuito en [Supabase](https://supabase.com) (PostgreSQL 500MB + Storage 1GB).
   * Los puertos `SpotReportRepository` y `SpotRepository` ya están preparados para intercambiar la implementación en memoria por Supabase con solo cambiar el adaptador en `src/application/container.ts`.

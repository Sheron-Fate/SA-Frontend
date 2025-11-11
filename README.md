# Спектроскопический анализ фрагмента живописи

## Лабораторная работа №6 · Адаптивность, PWA, Tauri, Развертывание

### Цель
- внедрить менеджер состояний для фильтров услуг;
- адаптировать SPA под мобильные и десктопные размеры;
- добавить поддержку PWA и оффлайн-режима;
- развернуть фронтенд на GitHub Pages;
- собрать нативное приложение на Tauri, работающее с API по IP локальной сети;
- обеспечить работу проекта по HTTPS и подготовить демонстрацию полного сценария.

### Порядок демонстрации
1. Открыть GitHub Pages с mock-данными на телефоне, установить приложение как PWA.
2. Запустить PWA, применить фильтрацию, перейти на главную и вернуться — фильтры должны сохраниться.
3. Показать адаптивность в DevTools, описать конкретные размеры карточек и число колонок на брейкпоинтах.
4. На ПК запустить Tauri, подключённый к API по IP локальной сети; сверить IP в консоли и в коде.
5. Изменить данные в БД и убедиться, что Tauri-представление обновилось.
6. Продемонстрировать работу через HTTPS (Pages + локальный стек).

### Методические материалы
- **PWA, GitHub Pages, адаптивность** — `PWA.md`: gh-pages деплой, Vite `base`, manifest/service worker, vite-plugin-pwa, mkcert и примеры медиазапросов.
- **Redux Toolkit** — `redux_toolkit.md`: структура store/slice, `configureStore`, `useSelector`/`useDispatch`, примеры работы с AJAX.
- **Tauri** — `Tauri.md`: инициализация `npm run tauri init`, конфигурация `tauri.conf.json`, dev/build режимы, работа с IP, плагины `cors-fetch` и `http`.

### Ключевые требования реализации
- Redux Toolkit хранит поисковую строку, выбранные фильтры, состояние загрузки/ошибок, а также обеспечивает восстановление фильтров при возврате на страницу (web, PWA, Tauri).
- Адаптивность покрывает три страницы (главная, список, детальная). Нужно зафиксировать правила:
  - ≤576px — одна колонка, карточка 100% ширины;
  - 577–991px — две колонки, карточка min 280px;
  - ≥992px — три колонки, карточка min 320px.
- PWA: manifest с иконками, `display: standalone`, сервис-воркер с кешированием статики и mock-ответов, autoUpdate (vite-plugin-pwa).
- GitHub Pages: `base` и `BrowserRouter basename`, скрипт `npm run deploy`, сборка `npm run build`.
- HTTPS: для локальной разработки — `mkcert` + `vite-plugin-mkcert`, для Pages — автоматический сертификат GitHub.
- Tauri: приложение без авторизации, три страницы, фильтры, картинки. Должно работать с IP (например, `http://192.168.x.x:8080/api`), иметь публичный конфиг для смены хоста, подключённый `redux`-store и оффлайн-моки.

---

## Roadmap (по методическим указаниям)

### 1. Аналитика и подготовка
- Зафиксировать breakpoints и размеры карточек (ориентироваться на примеры адаптивной сетки из `PWA.md`).
- Спланировать структуру Redux: модуль `store`, срез `filtersSlice`, селекторы и экспорт action’ов.
- Подготовить иконки (192/512), manifest шаблон, service worker сценарий.
- Определить ветку/репозиторий для GitHub Pages, убедиться в доступе к gh-pages.
- Проверить наличие Rust, Node, Tauri CLI (`npm run tauri info`).

### 2. Redux Toolkit (см. `redux_toolkit.md`)
1. Установить `@reduxjs/toolkit` и `react-redux`.
2. Создать `store/index.ts` через `configureStore`, добавить `filtersSlice`:
   - состояние: `search`, `color`, `dateRange`, `persistedAt`.
   - действия: `setSearch`, `setColor`, `setDateRange`, `resetFilters`.
   - ценовых фильтров нет (данные без цены), вместо них используется диапазон дат `created_at`.
3. Настроить `Provider` в `main.tsx`.
4. Добавить типизированные хуки `useAppDispatch/useAppSelector`.
5. Сохранение состояния: либо `redux-persist`, либо кастомный middleware (localStorage + восстановление при старте).
6. Подключить Redux DevTools (автоматически через `configureStore`).
7. Обновить страницы:
   - `PigmentsPage` и PWA/Tauri должны читать фильтры из Redux.
   - В `useEffect` синхронизировать `useState` → Redux или перейти полностью на Redux.
   - Навигация между страницами не должна сбрасывать фильтры.

### 3. Адаптивность (см. `PWA.md`, раздел 3–4)
1. Описать брейкпоинты в `index.css` (mobile-first):
   - base: flex/grid с `gap`, карточка `flex: 1 1 320px`.
   - `@media (max-width: 991px)`: `flex: 1 1 280px`.
   - `@media (max-width: 576px)`: `flex-direction: column`, элементы шириной 100%.
2. Обновить карточки (`PigmentCard`) и сетку (`Row`) для работы без Bootstrap-ограничений (или скорректировать классы `Row` + `Col`).
3. Navbar и footer: убедиться, что элементы не ломаются на <545px (пример бургер-меню в методичке; при необходимости доработать toggler).
4. Проверить детальную страницу (картинка → full width на мобильном).
5. Зафиксировать конкретные значения для демонстрации (таблица размеров в README или комментарии в коде).

#### Фактические брейкпоинты (реализовано)
- ≥ 992 px: `repeat(auto-fit, minmax(320px, 1fr))` — до трёх карточек в ряд, фильтры располагаются в строку.
- 577–991 px: `minmax(280px, 1fr)` — две карточки, фильтры перераспределяются по ширине.
- ≤ 576 px: один столбец, фильтры и кнопки растягиваются на 100%, карточки с уменьшенной высотой изображения (150 px).
- Карточки используют flex-раскладку, кнопка «Подробнее» прижата к низу, текст не обрезается на мобильных.
- Блок фильтров включает поля поиска, цвета и диапазона дат `created_at`; на мобильных элементы становятся вертикальными.

### 4. PWA (см. `PWA.md`, раздел 2)
1. Установить `vite-plugin-pwa`.
2. В `vite.config.ts` добавить:
   ```ts
   import { VitePWA } from 'vite-plugin-pwa'
   VitePWA({
     registerType: 'autoUpdate',
     devOptions: { enabled: true },
     manifest: {
       name: 'Spectroscopic Analysis',
       short_name: 'SpectroLab',
       start_url: '/<repo-name>/',
       display: 'standalone',
       background_color: '#f7f7f7',
       theme_color: '#A6541D',
       orientation: 'portrait-primary',
       icons: [
         { src: '/pwa-192.png', sizes: '192x192', type: 'image/png' },
         { src: '/pwa-512.png', sizes: '512x512', type: 'image/png' }
       ]
     }
   })
   ```
3. Добавить иконки в `public/`.
4. В `main.tsx` зарегистрировать `registerSW` (и убедиться, что `tsconfig.app.json` включает типы `vite-plugin-pwa`).
5. Проверить через Lighthouse (PWA, Performance) и оффлайн-режим (mock-данные через service worker).

### 5. GitHub Pages (см. `PWA.md`, раздел 1)
1. Установить `gh-pages`, добавить в `package.json`:
   ```json
   "homepage": "https://<USER>.github.io/<RepoName>/",
   "scripts": {
     "predeploy": "npm run build",
     "deploy": "gh-pages -d dist"
   }
   ```
2. В `vite.config.ts` установить `base: '/<RepoName>/'`.
3. В `Routes` или `RouterProvider` использовать `basename="/<RepoName>"`.
4. Проверить, что все навигации используют `Link` вместо `<a>`.
5. Выполнить `npm run deploy`, проверить публикацию и работу PWA/статических запросов.

### 6. HTTPS
1. Установить `mkcert`, сгенерировать `cert.crt`/`cert.key`.
2. Добавить `vite-plugin-mkcert`:
   ```ts
   import mkcert from 'vite-plugin-mkcert'
   server: {
     https: {
       key: fs.readFileSync('cert.key'),
       cert: fs.readFileSync('cert.crt'),
     },
     proxy: { ... }
   }
   ```
3. Убедиться, что сервис-воркер активен на `https://<local-ip>:3000`.
4. Для Pages — включить Enforce HTTPS в настройках репозитория.

### 7. Tauri (см. `Tauri.md`)
1. Установить `@tauri-apps/api` и `@tauri-apps/cli`, добавить скрипт `"tauri": "tauri"`.
2. `npm run tauri init` (frontendDist → `../dist` или `../build`, devUrl → `http://localhost:3000`).
3. Настроить `src-tauri/tauri.conf.json`:
   - `build.beforeDevCommand = "npm run dev"`, `beforeBuildCommand = "npm run build"`.
   - `allowlist.http.request = true`, `scope` → `http://192.168.x.x:8080/**`.
   - `plugins.http` + `tauri-plugin-cors-fetch` (для обхода CORS в release).
4. Создать общий конфиг (`src/config/target.ts`), который определяет `IS_TAURI`, `API_BASE_URL`, `MINIO_BASE_URL`, `USE_PROXY_IMAGES` (использует `VITE_TAURI_API_URL`, `VITE_TAURI_MINIO_BASE_URL` при сборке под Tauri).
5. Переписать `fetch`/картинки на использование констант из `config/target.ts`.
6. Для build-режима убедиться, что `import.meta.env.BASE_URL` не содержит базового префикса (уже настроено через `createBrowserRouter`).
7. Запустить `npm run tauri dev`, проверить подключение по IP и загрузку изображений с MinIO.
8. `npm run tauri build`, убедиться, что bundle отображает реальные данные (после правок в БД).
9. Перед сборкой указать в `.env` значения `VITE_TAURI_API_URL` (например, `http://192.168.0.101:8080/api`) и `VITE_TAURI_MINIO_BASE_URL` (например, `http://192.168.0.101:9000/colourlex`) — они используются в `config/target.ts`.

### 8. Демонстрационный сценарий
- PWA: установка, фильтры, возврат.
- Responsive: показать значения брейкпоинтов и колонок.
- Tauri: IP в логах + конфиг, обновление после изменения данных.
- HTTPS: подтвердить сертификаты (локально и на Pages).
- Подготовить заметки для объяснения Redux-хранилища и адаптивных правил.

---

## TODO
- [ ] Подготовить ветку и репозиторий для GitHub Pages.
- [ ] Интегрировать Redux Toolkit и сохранение фильтров.
- [ ] Реализовать адаптивную сетку для трёх страниц.
- [ ] Настроить PWA (manifest, service worker, иконки).
- [ ] Настроить деплой на GitHub Pages.
- [ ] Подключить mkcert и проверить HTTPS локально.
- [ ] Инициализировать и настроить Tauri (dev + build).
- [ ] Составить сценарий демонстрации и список контрольных проверок.

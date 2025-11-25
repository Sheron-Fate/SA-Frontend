export const ROUTES = {
  HOME: "/",
  PIGMENTS: "/pigments",
  SPECTRUM: "/spectrum-analysis",
  LOGIN: "/login",
  REGISTER: "/register",
  APPLICATION: "/applications",
  PROFILE: "/profile",
}

export type RouteKeyType = keyof typeof ROUTES;

export const ROUTE_LABELS: {[key in RouteKeyType]: string} = {
  HOME: "Главная",
  PIGMENTS: "Пигменты",
  SPECTRUM: "Спектральный анализ",
  LOGIN: "Вход",
  REGISTER: "Регистрация",
  APPLICATION: "Заявка",
  PROFILE: "Профиль",
};

export const ROUTES = {
  HOME: "/",
  PIGMENTS: "/pigments",
  SPECTRUM: "/spectrum-analysis",
}

export type RouteKeyType = keyof typeof ROUTES;

export const ROUTE_LABELS: {[key in RouteKeyType]: string} = {
  HOME: "Главная",
  PIGMENTS: "Пигменты",
  SPECTRUM: "Спектральный анализ",
};

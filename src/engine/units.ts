import { AU, C, DAY, LY, YEAR } from "./constants";

export function formatDistance(meters: number): string {
  const abs = Math.abs(meters);
  if (abs < 1_000) return `${meters.toFixed(1)} m`;
  if (abs < 1_000_000) return `${(meters / 1_000).toFixed(1)} km`;
  if (abs < 0.01 * AU) return `${(meters / 1_000).toFixed(0)} km`;
  if (abs < 10_000 * AU) return `${(meters / AU).toFixed(3)} AU`;
  if (abs < 10 * LY) return `${(meters / LY).toFixed(3)} ly`;
  return `${(meters / LY).toFixed(1)} ly`;
}

export function formatMass(kg: number): string {
  const solar = kg / 1.98847e30;
  const earth = kg / 5.9722e24;
  const jupiter = kg / 1.8982e27;
  if (solar >= 0.01) return `${solar.toFixed(3)} M☉`;
  if (jupiter >= 0.01) return `${jupiter.toFixed(3)} M♃`;
  if (earth >= 0.01) return `${earth.toFixed(3)} M⊕`;
  return `${kg.toExponential(3)} kg`;
}

export function formatRadius(meters: number): string {
  const earth = meters / 6.371e6;
  const solar = meters / 6.957e8;
  if (solar >= 0.01) return `${solar.toFixed(3)} R☉ · ${formatDistance(meters)}`;
  if (earth >= 0.05) return `${earth.toFixed(3)} R⊕ · ${formatDistance(meters)}`;
  return formatDistance(meters);
}

export function formatTime(seconds: number): string {
  const abs = Math.abs(seconds);
  if (abs < 60) return `${seconds.toFixed(1)} s`;
  if (abs < 3600) {
    const m = Math.floor(abs / 60);
    const s = Math.round(abs % 60);
    return `${m}m ${String(s).padStart(2, "0")}s`;
  }
  if (abs < DAY) return `${(seconds / 3600).toFixed(2)} h`;
  if (abs < YEAR) return `${(seconds / DAY).toFixed(2)} d`;
  return `${(seconds / YEAR).toFixed(3)} yr`;
}

export function formatSpeed(metersPerSecond: number): string {
  const abs = Math.abs(metersPerSecond);
  if (abs > 0.01 * C) return `${(metersPerSecond / C).toFixed(4)} c`;
  if (abs >= 1000) return `${(metersPerSecond / 1000).toFixed(2)} km/s`;
  return `${metersPerSecond.toFixed(1)} m/s`;
}

export function formatTemperature(kelvin: number): string {
  return `${Math.round(kelvin).toLocaleString()} K`;
}

export function lightTravelTime(meters: number): string {
  return formatTime(meters / C);
}

export function formatSimDate(secondsSinceJ2000: number): string {
  const ms = Date.UTC(2000, 0, 1, 12, 0, 0) + secondsSinceJ2000 * 1000;
  const date = new Date(ms);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toISOString().replace("T", " ").slice(0, 19) + " UTC";
}

export function formatTimeScale(scale: number): string {
  if (scale === 0) return "paused";
  const abs = Math.abs(scale);
  const sign = scale < 0 ? "−" : "";
  if (abs === 1) return `${sign}1× realtime`;
  if (abs < 60) return `${sign}${abs.toFixed(0)}×`;
  if (abs < DAY) return `${sign}${(abs / 3600).toFixed(abs >= 36000 ? 0 : 1)} h/s`;
  if (abs < 365.25 * DAY) return `${sign}${(abs / DAY).toFixed(abs >= 10 * DAY ? 0 : 1)} d/s`;
  return `${sign}${(abs / (365.25 * DAY)).toFixed(abs >= 100 * 365.25 * DAY ? 0 : 1)} yr/s`;
}

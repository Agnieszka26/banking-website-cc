export const FONT_SCALE_STORAGE_KEY = "banking-app-font-scale";

export const FONT_SCALE_MIN = 0;
export const FONT_SCALE_MAX = 4;
export const FONT_SCALE_DEFAULT = 2;

/** Target root sizes in px — level 2 is the default 16px base. */
export const FONT_SCALE_ROOT_PX = [14, 15, 16, 18, 20] as const;

const DEFAULT_ROOT_PX = FONT_SCALE_ROOT_PX[FONT_SCALE_DEFAULT];

/** Clamps a font scale level to the supported min/max range. */
export function clampFontScale(level: number): number {
	return Math.min(FONT_SCALE_MAX, Math.max(FONT_SCALE_MIN, level));
}

/** Returns the CSS multiplier for a font scale level relative to the default size. */
export function getFontScaleMultiplier(level: number): number {
	return FONT_SCALE_ROOT_PX[clampFontScale(level)] / DEFAULT_ROOT_PX;
}

/** Reads the persisted font scale level from localStorage, or the default. */
export function readFontScale(): number {
	if (typeof window === "undefined") {
		return FONT_SCALE_DEFAULT;
	}

	const stored = window.localStorage.getItem(FONT_SCALE_STORAGE_KEY);
	if (stored === null) {
		return FONT_SCALE_DEFAULT;
	}

	const parsed = Number.parseInt(stored, 10);
	return Number.isNaN(parsed) ? FONT_SCALE_DEFAULT : clampFontScale(parsed);
}

/** Applies the font scale level to the document root element. */
export function applyFontScale(level: number): void {
	if (typeof document === "undefined") {
		return;
	}

	const clamped = clampFontScale(level);
	const rootPx = FONT_SCALE_ROOT_PX[clamped];
	const multiplier = getFontScaleMultiplier(clamped);
	const root = document.documentElement;

	root.style.setProperty("--font-scale", String(multiplier));
	root.style.fontSize = `${rootPx}px`;
	root.dataset.fontScale = String(clamped);
}

/** Persists, applies, and returns the clamped font scale level. */
export function persistFontScale(level: number): number {
	const clamped = clampFontScale(level);

	if (typeof window !== "undefined") {
		window.localStorage.setItem(FONT_SCALE_STORAGE_KEY, String(clamped));
	}

	applyFontScale(clamped);
	return clamped;
}

import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
	type ReactNode,
} from "react";
import {
	applyFontScale,
	FONT_SCALE_DEFAULT,
	FONT_SCALE_MAX,
	FONT_SCALE_MIN,
	FONT_SCALE_STORAGE_KEY,
	persistFontScale,
	readFontScale,
} from "#/lib/font-scale";

type FontScaleContextValue = {
	level: number;
	decrease: () => void;
	increase: () => void;
	canDecrease: boolean;
	canIncrease: boolean;
};

const FontScaleContext = createContext<FontScaleContextValue | null>(null);

export function FontScaleProvider({ children }: { children: ReactNode }) {
	const [level, setLevel] = useState(FONT_SCALE_DEFAULT);

	useEffect(() => {
		const initial = readFontScale();
		setLevel(initial);
		persistFontScale(initial);
	}, []);

	useEffect(() => {
		const onStorage = (event: StorageEvent) => {
			if (event.key !== FONT_SCALE_STORAGE_KEY) {
				return;
			}

			const next = readFontScale();
			setLevel(next);
			applyFontScale(next);
		};

		window.addEventListener("storage", onStorage);
		return () => window.removeEventListener("storage", onStorage);
	}, []);

	const updateScale = useCallback((updater: (current: number) => number) => {
		setLevel((current) => persistFontScale(updater(current)));
	}, []);

	const decrease = useCallback(() => {
		updateScale((current) => current - 1);
	}, [updateScale]);

	const increase = useCallback(() => {
		updateScale((current) => current + 1);
	}, [updateScale]);

	const value = useMemo(
		() => ({
			level,
			decrease,
			increase,
			canDecrease: level > FONT_SCALE_MIN,
			canIncrease: level < FONT_SCALE_MAX,
		}),
		[level, decrease, increase],
	);

	return (
		<FontScaleContext.Provider value={value}>
			{children}
		</FontScaleContext.Provider>
	);
}

export function useFontScale(): FontScaleContextValue {
	const context = useContext(FontScaleContext);

	if (!context) {
		throw new Error("useFontScale must be used within FontScaleProvider");
	}

	return context;
}

export type ThemePreference = "system" | "light" | "dark";

export const THEME_STORAGE_KEY = "theme";

// Runs inline in <head> before anything paints, so a dark system preference
// doesn't flash the light theme first. Kept as a plain string because it has
// to work before React or any bundle has loaded
export const themeScript = `(function(){try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");var d=t==="dark"||(t!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d)}catch(e){}})()`;

export function readPreference(): ThemePreference {
	try {
		const stored = localStorage.getItem(THEME_STORAGE_KEY);
		if (stored === "light" || stored === "dark") return stored;
	} catch {
		// Storage can be blocked, the system preference still applies
	}
	return "system";
}

export function applyPreference(preference: ThemePreference) {
	const dark =
		preference === "dark" ||
		(preference === "system" &&
			window.matchMedia("(prefers-color-scheme: dark)").matches);
	document.documentElement.classList.toggle("dark", dark);
}

export function savePreference(preference: ThemePreference) {
	try {
		if (preference === "system") localStorage.removeItem(THEME_STORAGE_KEY);
		else localStorage.setItem(THEME_STORAGE_KEY, preference);
	} catch {
		// Nothing to do, the choice just won't outlive the tab
	}
	applyPreference(preference);
}

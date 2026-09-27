import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "#/components/ui/button";
import {
	applyPreference,
	readPreference,
	savePreference,
	type ThemePreference,
} from "./theme";

const next: Record<ThemePreference, ThemePreference> = {
	system: "light",
	light: "dark",
	dark: "system",
};

const labels: Record<ThemePreference, string> = {
	system: "Theme follows your system",
	light: "Light theme",
	dark: "Dark theme",
};

// Cycles system, light, dark. System is the default and the only one that
// changes by itself, when the operating system switches over at night
export function ThemeToggle() {
	const [preference, setPreference] = useState<ThemePreference>("system");

	useEffect(() => {
		setPreference(readPreference());
	}, []);

	useEffect(() => {
		if (preference !== "system") return;
		const query = window.matchMedia("(prefers-color-scheme: dark)");
		const onChange = () => applyPreference("system");
		query.addEventListener("change", onChange);
		return () => query.removeEventListener("change", onChange);
	}, [preference]);

	const Icon =
		preference === "dark"
			? MoonIcon
			: preference === "light"
				? SunIcon
				: MonitorIcon;

	return (
		<Button
			variant="ghost"
			size="icon"
			title={`${labels[preference]}, click to change`}
			aria-label={`${labels[preference]}, click to change`}
			onClick={() => {
				const chosen = next[preference];
				savePreference(chosen);
				setPreference(chosen);
			}}
		>
			<Icon />
		</Button>
	);
}

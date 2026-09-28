// The same switch the sample sources list on /press always had, lifted out so
// the real lists can share it
export function Switch({
	checked,
	onChange,
	label,
	disabled,
}: {
	checked: boolean;
	onChange: (checked: boolean) => void;
	label: string;
	disabled?: boolean;
}) {
	return (
		<button
			type="button"
			role="switch"
			aria-checked={checked}
			aria-label={label}
			disabled={disabled}
			onClick={() => onChange(!checked)}
			className="relative h-5 w-9 shrink-0 rounded-full bg-input transition-colors disabled:opacity-50 aria-checked:bg-primary"
		>
			<span
				className={`absolute top-0.5 left-0.5 size-4 rounded-full bg-background shadow-sm transition-transform ${checked ? "translate-x-4" : ""}`}
			/>
		</button>
	);
}

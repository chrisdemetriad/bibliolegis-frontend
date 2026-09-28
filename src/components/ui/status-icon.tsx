import { CheckIcon, XIcon } from "lucide-react";
import { cn } from "#/lib/utils";

// A filled circle for how something finished, green with a tick or red with
// a cross. Used wherever a finished or failed state gets an icon
export function StatusIcon({
	status,
	className,
}: {
	status: "success" | "error";
	className?: string;
}) {
	const Icon = status === "success" ? CheckIcon : XIcon;
	return (
		<span
			className={cn(
				"inline-flex size-4 shrink-0 items-center justify-center rounded-full",
				status === "success"
					? "bg-success text-success-foreground"
					: "bg-destructive text-white",
				className,
			)}
		>
			<Icon className="size-2.5" strokeWidth={3.5} aria-hidden />
		</span>
	);
}

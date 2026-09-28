import { useId, useState } from "react";

// Roughly a working year once leave and bank holidays are out
const WORKING_DAYS = 220;

const pounds = new Intl.NumberFormat("en-GB", {
	style: "currency",
	currency: "GBP",
	maximumFractionDigits: 0,
});

// The visitor's own numbers rather than a headline figure of ours. We have no
// customers to measure yet, so anything bolder would be made up
export function HoursCalculator() {
	const [feeEarners, setFeeEarners] = useState(10);
	const [rate, setRate] = useState(200);
	const [hours, setHours] = useState(1);

	const perPerson = rate * hours * WORKING_DAYS;
	const total = perPerson * feeEarners;

	return (
		<div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-center">
			<div className="space-y-7">
				<Slider
					label="Fee earners"
					value={feeEarners}
					display={String(feeEarners)}
					min={1}
					max={50}
					step={1}
					onChange={setFeeEarners}
				/>
				<Slider
					label="Hourly rate"
					value={rate}
					display={pounds.format(rate)}
					min={100}
					max={500}
					step={10}
					onChange={setRate}
				/>
				<Slider
					label="Time saved per fee earner, per day"
					value={hours}
					display={hours === 1 ? "1 hour" : `${hours} hours`}
					min={0.25}
					max={2}
					step={0.25}
					onChange={setHours}
				/>
			</div>

			<div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center lg:min-w-80">
				<p className="text-sm text-white/60">Billable time back each year</p>
				<p className="mt-2 font-logo text-6xl text-brass tabular-nums">
					{pounds.format(total)}
				</p>
				<p className="mt-3 text-sm text-white/60">
					{pounds.format(perPerson)} per fee earner
				</p>
			</div>
		</div>
	);
}

function Slider({
	label,
	value,
	display,
	min,
	max,
	step,
	onChange,
}: {
	label: string;
	value: number;
	display: string;
	min: number;
	max: number;
	step: number;
	onChange: (value: number) => void;
}) {
	const id = useId();
	return (
		<div>
			<div className="mb-2 flex items-baseline justify-between gap-4 text-sm">
				<label htmlFor={id} className="text-white/70">
					{label}
				</label>
				<span className="font-medium text-white tabular-nums">{display}</span>
			</div>
			<input
				id={id}
				type="range"
				min={min}
				max={max}
				step={step}
				value={value}
				onChange={(e) => onChange(Number(e.target.value))}
				className="w-full accent-brass"
			/>
		</div>
	);
}

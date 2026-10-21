import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { usePreferences, useSavePreferences } from "#/activity/queries";
import { type ChatModel, errorMessage, type Preferences } from "#/api/client";
import { useApi } from "#/api/useApi";
import { Checkbox } from "#/components/ui/checkbox";
import { Label } from "#/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "#/components/ui/toggle-group";
import { Page } from "#/shell/page";

export const Route = createFileRoute("/_authed/settings")({
	component: SettingsPage,
});

const providerNames: Record<ChatModel["provider"], string> = {
	openai: "OpenAI",
	anthropic: "Anthropic",
};

function SettingsPage() {
	const api = useApi();
	const queryClient = useQueryClient();
	const models = useQuery({
		queryKey: ["chat-models"],
		queryFn: () => api.listChatModels(),
		// The list only changes when the api is redeployed
		staleTime: Number.POSITIVE_INFINITY,
	});
	const mine = useQuery({
		queryKey: ["my-model"],
		queryFn: () => api.getMyModel(),
	});
	const save = useMutation({
		mutationFn: (model: string) => api.setMyModel(model),
		onSuccess: (choice) => queryClient.setQueryData(["my-model"], choice),
	});

	// Shows the choice straight away while it saves, and falls back to what the
	// api has if the save fails
	const selected = save.isPending ? save.variables : mine.data?.model;
	// Grouped in the order the api lists them, which is its own preference
	const providers = [
		...new Set((models.data ?? []).map((model) => model.provider)),
	];

	function chooseModel(id: string) {
		// A single toggle group clears its value when the chosen chip is pressed
		// again, there's always meant to be one model
		if (!id || id === selected) return;
		const label = models.data?.find((model) => model.id === id)?.label ?? id;
		save.mutate(id, {
			onSuccess: () => toast.success(`Switched to ${label}`),
		});
	}

	return (
		<Page>
			<h1 className="text-2xl font-semibold">Settings</h1>

			<section className="mt-8" aria-labelledby="model-heading">
				<h2 id="model-heading" className="text-lg font-medium">
					Model
				</h2>
				<p className="mt-1 text-sm text-muted-foreground">
					Which model answers your questions. It only changes your own answers,
					not anyone else's.
				</p>

				{(models.isPending || mine.isPending) && (
					<p className="mt-4 text-muted-foreground">Loading…</p>
				)}
				{(models.isError || mine.isError) && (
					<p className="mt-4 text-destructive">
						Couldn't load the models from the api.
					</p>
				)}

				{models.data && mine.data && (
					<div className="mt-4 space-y-5">
						{providers.map((provider) => (
							<div key={provider} className="space-y-2">
								<h3
									id={`provider-${provider}`}
									className="text-sm font-medium text-muted-foreground"
								>
									{providerNames[provider]}
								</h3>
								<ToggleGroup
									type="single"
									variant="outline"
									spacing={2}
									className="flex-wrap"
									value={
										models.data.some(
											(model) =>
												model.provider === provider && model.id === selected,
										)
											? selected
											: ""
									}
									onValueChange={chooseModel}
									aria-labelledby={`provider-${provider}`}
								>
									{models.data
										.filter((model) => model.provider === provider)
										.map((model) => (
											<ToggleGroupItem
												key={model.id}
												value={model.id}
												className="h-9 rounded-full px-4 data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
											>
												{model.label}
												{model.is_default && (
													<span className="text-xs font-normal opacity-70">
														default
													</span>
												)}
											</ToggleGroupItem>
										))}
								</ToggleGroup>
							</div>
						))}
					</div>
				)}

				<p className="mt-4 h-5 text-sm" aria-live="polite">
					{save.isPending && (
						<span className="text-muted-foreground">Saving…</span>
					)}
					{save.isSuccess && (
						<span className="text-muted-foreground">Saved.</span>
					)}
					{save.isError && (
						<span className="text-destructive">
							{errorMessage(save.error, "Couldn't save that, try again.")}
						</span>
					)}
				</p>
			</section>

			<OverviewSettings />
		</Page>
	);
}

// The api only accepts these, see RecentlyViewedCount there
const RECENTLY_VIEWED_COUNTS: Preferences["recently_viewed_count"][] = [3, 8];

function OverviewSettings() {
	const preferences = usePreferences();
	const save = useSavePreferences();
	const current = preferences.data;

	return (
		<section className="mt-10" aria-labelledby="overview-heading">
			<h2 id="overview-heading" className="text-lg font-medium">
				Overview
			</h2>
			<p className="mt-1 text-sm text-muted-foreground">
				What your overview page shows. Only you see these.
			</p>

			{preferences.isPending && (
				<p className="mt-4 text-muted-foreground">Loading…</p>
			)}
			{preferences.isError && (
				<p className="mt-4 text-destructive">
					Couldn't load your settings from the api.
				</p>
			)}

			{current && (
				<div className="mt-4 space-y-4">
					<div className="flex items-center gap-3">
						<Checkbox
							id="show-recently-viewed"
							checked={current.show_recently_viewed}
							onCheckedChange={(checked) => {
								const shown = checked === true;
								save.mutate(
									{ ...current, show_recently_viewed: shown },
									{
										onSuccess: () =>
											toast.success(
												shown
													? "Recently viewed shown"
													: "Recently viewed hidden",
											),
									},
								);
							}}
						/>
						<Label htmlFor="show-recently-viewed">Show Recently viewed</Label>
					</div>
					<div className="flex items-center gap-3">
						<Label
							htmlFor="recently-viewed-count"
							className={
								current.show_recently_viewed ? "" : "text-muted-foreground"
							}
						>
							How many matters to list
						</Label>
						<Select
							value={String(current.recently_viewed_count)}
							disabled={!current.show_recently_viewed}
							onValueChange={(value) => {
								const count = Number(
									value,
								) as Preferences["recently_viewed_count"];
								save.mutate(
									{ ...current, recently_viewed_count: count },
									{
										onSuccess: () =>
											toast.success(`Now listing ${count} matters`),
									},
								);
							}}
						>
							<SelectTrigger id="recently-viewed-count" size="sm">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{RECENTLY_VIEWED_COUNTS.map((count) => (
									<SelectItem key={count} value={String(count)}>
										{count}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</div>
			)}

			<p className="mt-4 h-5 text-sm" aria-live="polite">
				{save.isPending && (
					<span className="text-muted-foreground">Saving…</span>
				)}
				{save.isSuccess && (
					<span className="text-muted-foreground">Saved.</span>
				)}
				{save.isError && (
					<span className="text-destructive">
						{errorMessage(save.error, "Couldn't save that, try again.")}
					</span>
				)}
			</p>
		</section>
	);
}

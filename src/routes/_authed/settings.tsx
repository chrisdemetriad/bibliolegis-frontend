import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { type ChatModel, errorMessage } from "#/api/client";
import { useApi } from "#/api/useApi";
import { Label } from "#/components/ui/label";
import { RadioGroup, RadioGroupItem } from "#/components/ui/radio-group";
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
					<RadioGroup
						className="mt-4 gap-6"
						value={selected}
						onValueChange={(model) => save.mutate(model)}
						aria-labelledby="model-heading"
					>
						{providers.map((provider) => (
							<fieldset key={provider} className="space-y-3">
								<legend className="mb-3 text-sm font-medium text-muted-foreground">
									{providerNames[provider]}
								</legend>
								{models.data
									.filter((model) => model.provider === provider)
									.map((model) => (
										<div key={model.id} className="flex items-center gap-3">
											<RadioGroupItem
												value={model.id}
												id={`model-${model.id}`}
											/>
											<Label htmlFor={`model-${model.id}`}>
												{model.label}
												{model.is_default && (
													<span className="font-normal text-muted-foreground">
														(default)
													</span>
												)}
											</Label>
										</div>
									))}
							</fieldset>
						))}
					</RadioGroup>
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
		</Page>
	);
}

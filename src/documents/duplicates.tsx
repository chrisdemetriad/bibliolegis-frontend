import { useNavigate } from "@tanstack/react-router";
import { ArrowRightIcon } from "lucide-react";
import { type ReactNode, useCallback, useRef, useState } from "react";
import type { Duplicate } from "#/api/client";
import { useApi } from "#/api/useApi";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "#/components/ui/alert-dialog";
import { Button } from "#/components/ui/button";
import { cn } from "#/lib/utils";

// Hex SHA-256 of the file's bytes, the same fingerprint the api keeps for
// every upload. Content rather than name or size, so a renamed copy is still
// caught and two different files the same size aren't
export async function fingerprint(file: File) {
	const digest = await crypto.subtle.digest(
		"SHA-256",
		await file.arrayBuffer(),
	);
	return Array.from(new Uint8Array(digest), (byte) =>
		byte.toString(16).padStart(2, "0"),
	).join("");
}

type Place =
	| { key: string; kind: "matter"; slug: string; name: string }
	| { key: string; kind: "document"; id: string; name: string };

type Pending = {
	matches: { file: File; duplicate: Duplicate }[];
	resolve: (carryOn: boolean) => void;
};

// Before uploading, asks the api whether any of these files is already there
// and if so asks the person whether to carry on. `confirm` resolves true to
// upload as normal, false when they went to the matter instead or backed out.
// `dialog` has to be rendered for the question to show.
//
// currentProjectId is the matter being uploaded into, if any, so a copy
// already in that same matter can say so rather than offer to go there
export function useDuplicateCheck(currentProjectId?: string) {
	const api = useApi();
	const navigate = useNavigate();
	const [pending, setPending] = useState<Pending | null>(null);
	// Held so the dialog closing any way at all settles the promise once
	const pendingRef = useRef<Pending | null>(null);

	const settle = useCallback((carryOn: boolean) => {
		pendingRef.current?.resolve(carryOn);
		pendingRef.current = null;
		setPending(null);
	}, []);

	const confirm = useCallback(
		async (files: File[]): Promise<boolean> => {
			if (files.length === 0) return true;
			let matches: Pending["matches"];
			try {
				const hashes = await Promise.all(files.map(fingerprint));
				const found = new Map(
					(await api.findDuplicates([...new Set(hashes)])).map((item) => [
						item.sha256,
						item,
					]),
				);
				matches = files.flatMap((file, i) => {
					const duplicate = found.get(hashes[i]);
					return duplicate ? [{ file, duplicate }] : [];
				});
			} catch {
				// The check is a courtesy. If it can't be made the upload goes
				// ahead as it would have before there was one
				return true;
			}
			if (matches.length === 0) return true;
			return new Promise<boolean>((resolve) => {
				const next = { matches, resolve };
				pendingRef.current = next;
				setPending(next);
			});
		},
		[api],
	);

	// Where each copy already is, once per place. A matter when it's in one,
	// otherwise the document itself. Copies already in the matter being
	// uploaded into are left out, there's nowhere to go for those
	const places: Place[] = [];
	for (const { duplicate } of pending?.matches ?? []) {
		if (duplicate.matter?.id === currentProjectId && currentProjectId) continue;
		const key = duplicate.matter?.id ?? duplicate.document_id;
		if (places.some((place) => place.key === key)) continue;
		places.push(
			duplicate.matter
				? {
						key,
						kind: "matter",
						slug: duplicate.matter.slug,
						name: duplicate.matter.name,
					}
				: {
						key,
						kind: "document",
						id: duplicate.document_id,
						name: duplicate.filename,
					},
		);
	}

	const goTo = (place: Place) => {
		settle(false);
		if (place.kind === "matter") {
			void navigate({
				to: "/matters/$matterId/overview",
				params: { matterId: place.slug },
			});
		} else {
			void navigate({
				to: "/documents/$documentId",
				params: { documentId: place.id },
			});
		}
	};

	const dialog: ReactNode = (
		<AlertDialog
			open={pending !== null}
			onOpenChange={(open) => {
				if (!open) settle(false);
			}}
		>
			{/* The list can run long, so half the screen when there's room for it
			    and scroll rather than run off the top and bottom */}
			<AlertDialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto data-[size=default]:sm:max-w-[max(24rem,50vw)]">
				<AlertDialogHeader>
					<AlertDialogTitle>
						{pending && pending.matches.length > 1
							? "Some of these files have already been processed"
							: "This file seems to have been processed already"}
					</AlertDialogTitle>
					<AlertDialogDescription asChild>
						<div className="space-y-3">
							<ul className="space-y-2">
								{pending?.matches.map(({ file, duplicate }) => (
									<li key={`${file.name}-${duplicate.document_id}`}>
										<span className="font-medium text-foreground">
											{file.name}
										</span>{" "}
										{describe(file, duplicate, currentProjectId)}
									</li>
								))}
							</ul>
							<p>
								Are you sure{" "}
								{pending && pending.matches.length > 1
									? "these files are"
									: "this file is"}{" "}
								different? Carrying on uploads everything you dropped, and a
								file about a matter you already have joins that matter.
							</p>
						</div>
					</AlertDialogDescription>
				</AlertDialogHeader>
				{/* Spread apart so going elsewhere and carrying on aren't side by side */}
				<AlertDialogFooter
					className={cn(
						"sm:justify-between",
						places.length > 1 && "sm:flex-col sm:items-stretch",
					)}
				>
					{places.length === 0 ? (
						<AlertDialogCancel>Don't upload</AlertDialogCancel>
					) : places.length === 1 ? (
						<AlertDialogCancel onClick={() => goTo(places[0])}>
							{places[0].kind === "matter" ? "Go to matter" : "Go to document"}
						</AlertDialogCancel>
					) : (
						// One per place, so it's clear which matter each one opens
						<div className="flex flex-col items-start gap-1">
							{places.map((place) => (
								<Button
									key={place.key}
									variant="link"
									className="h-auto max-w-full justify-start px-0 py-0.5 text-left whitespace-normal text-foreground"
									onClick={() => goTo(place)}
								>
									Go to {place.name}
									{place.kind === "matter" && " matter"}
									<ArrowRightIcon data-icon="inline-end" />
								</Button>
							))}
						</div>
					)}
					<AlertDialogAction
						className="sm:self-end"
						onClick={() => settle(true)}
					>
						Continue uploading
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);

	return { confirm, dialog };
}

function describe(file: File, duplicate: Duplicate, currentProjectId?: string) {
	// Only worth saying when it was renamed, otherwise it's the same name twice
	const called =
		duplicate.filename === file.name
			? ""
			: `, where it's called ${duplicate.filename}`;
	if (!duplicate.matter) {
		return `was uploaded before${called} and isn't in a matter yet.`;
	}
	if (duplicate.matter.id === currentProjectId) {
		return `is already in this matter${called}.`;
	}
	return (
		<>
			already belongs to{" "}
			<span className="font-medium text-foreground">
				{duplicate.matter.name}
			</span>
			{called}.
		</>
	);
}

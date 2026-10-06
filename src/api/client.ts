import createClient, { type Middleware } from "openapi-fetch";
import type { components, paths } from "./schema.gen";

type Schemas = components["schemas"];

export type Document = Schemas["DocumentOut"];
export type Project = Schemas["ProjectOut"];
export type ProjectParty = Schemas["PartyOut"];
export type ProjectDate = Schemas["DateOut"];
export type Intake = Schemas["IntakeOut"];
export type QueryAnswer = Schemas["QueryOut"];
export type QueryHistoryItem = Schemas["QueryHistoryOut"];
export type Citation = Schemas["CitationOut"];
export type Passage = Schemas["PassageOut"];
export type IntakeMatter = Schemas["IntakeMatterOut"];
export type ProjectCreate = Schemas["ProjectCreate"];
export type ProjectMember = Schemas["ProjectMemberOut"];
export type MemberAdd = Schemas["MemberAdd"];
export type StaffAccount = Schemas["StaffAccount"];
export type UserProfile = Schemas["UserProfile"];
export type ChatModel = Schemas["ChatModelOut"];
export type Duplicate = Schemas["DuplicateOut"];
export type Activity = Schemas["ActivityOut"];
export type RecentlyViewed = Schemas["RecentlyViewedOut"];
export type Preferences = Schemas["Preferences"];
export type PressMention = Schemas["PressMentionOut"];
export type PressArticle = Schemas["PressArticleOut"];
export type PressTerms = Schemas["PressTerms"];
export type PressTermsOut = Schemas["PressTermsOut"];
export type PressSource = Schemas["PressSourceOut"];
export type PressSourceCreate = Schemas["PressSourceCreate"];
export type PressSourceUpdate = Schemas["PressSourceUpdate"];
export type PressPreview = Schemas["PagePreviewOut"];
export type PressRefresh = Schemas["PressRefreshOut"];
export type MentionStatus = Schemas["MentionUpdate"]["status"];
export type DocumentListQuery = NonNullable<
	paths["/documents"]["get"]["parameters"]["query"]
>;

export class ApiError extends Error {
	constructor(
		readonly status: number,
		// Whatever the backend sent back, usually FastAPI's { detail }
		readonly body: unknown,
	) {
		super(`API request failed with ${status}`);
		this.name = "ApiError";
	}
}

type Result<T> = { data?: T; error?: unknown; response: Response };

function unwrap<T>({ data, error, response }: Result<T>): T {
	if (error !== undefined || !response.ok) {
		throw new ApiError(response.status, error);
	}
	return data as T;
}

export interface ApiOptions {
	baseUrl?: string;
	// Called before every request. useApi() passes Clerk's getToken here
	getToken?: () => Promise<string | null>;
}

// A factory rather than one shared client, so the token source belongs to
// whoever created it. A module level token would be shared between users
// once anything calls the api during server rendering.
export function createApi({
	baseUrl = import.meta.env.VITE_API_URL,
	getToken,
}: ApiOptions = {}) {
	const client = createClient<paths>({ baseUrl });

	// XMLHttpRequest rather than fetch because fetch can't report upload
	// progress, and a large scanned bundle can take long enough that a bare
	// spinner looks stuck
	async function postWithProgress<T>(
		path: string,
		form: FormData,
		onProgress?: (fraction: number) => void,
	): Promise<T> {
		const token = await getToken?.();
		return new Promise((resolve, reject) => {
			const xhr = new XMLHttpRequest();
			xhr.open("POST", `${baseUrl}${path}`);
			if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
			xhr.responseType = "json";
			xhr.upload.onprogress = (event) => {
				if (event.lengthComputable) onProgress?.(event.loaded / event.total);
			};
			xhr.onload = () => {
				if (xhr.status >= 200 && xhr.status < 300) resolve(xhr.response);
				else reject(new ApiError(xhr.status, xhr.response));
			};
			// Network failure or CORS, there's no status to report
			xhr.onerror = () => reject(new ApiError(0, null));
			xhr.send(form);
		});
	}

	if (getToken) {
		const auth: Middleware = {
			async onRequest({ request }) {
				const token = await getToken();
				if (token) request.headers.set("Authorization", `Bearer ${token}`);
				return request;
			},
		};
		client.use(auth);
	}

	return {
		health: async () => unwrap(await client.GET("/health")),

		me: async () => unwrap(await client.GET("/users/me")),

		listChatModels: async () => unwrap(await client.GET("/chat-models")),

		getMyModel: async () => unwrap(await client.GET("/users/me/model")),

		setMyModel: async (model: string) =>
			unwrap(await client.PUT("/users/me/model", { body: { model } })),

		getMyPreferences: async () =>
			unwrap(await client.GET("/users/me/preferences")),

		setMyPreferences: async (body: Preferences) =>
			unwrap(await client.PUT("/users/me/preferences", { body })),

		listRecentlyViewed: async () =>
			unwrap(await client.GET("/users/me/recently-viewed")),

		// Without a project, activity across every matter the user is on
		listActivity: async (projectRef?: string, limit?: number) =>
			unwrap(
				await client.GET("/activity", {
					params: { query: { project: projectRef, limit } },
				}),
			),

		listUsers: async () => unwrap(await client.GET("/users")),

		changeRole: async (userId: string, role: string) =>
			unwrap(
				await client.PATCH("/users/{user_id}/role", {
					params: { path: { user_id: userId } },
					body: { role },
				}),
			),

		deactivateUser: async (userId: string) =>
			unwrap(
				await client.PATCH("/users/{user_id}", {
					params: { path: { user_id: userId } },
				}),
			),

		listProjects: async () => unwrap(await client.GET("/projects")),

		// Takes the id or the slug, the frontend addresses matters by slug
		getProject: async (projectRef: string) =>
			unwrap(
				await client.GET("/projects/{project_ref}", {
					params: { path: { project_ref: projectRef } },
				}),
			),

		pinProject: async (projectRef: string) => {
			unwrap(
				await client.PUT("/projects/{project_ref}/pin", {
					params: { path: { project_ref: projectRef } },
				}),
			);
		},

		unpinProject: async (projectRef: string) => {
			unwrap(
				await client.DELETE("/projects/{project_ref}/pin", {
					params: { path: { project_ref: projectRef } },
				}),
			);
		},

		// Takes every document in the matter with it, files included
		deleteProject: async (projectRef: string) => {
			unwrap(
				await client.DELETE("/projects/{project_ref}", {
					params: { path: { project_ref: projectRef } },
				}),
			);
		},

		recordView: async (projectRef: string) => {
			unwrap(
				await client.PUT("/projects/{project_ref}/view", {
					params: { path: { project_ref: projectRef } },
				}),
			);
		},

		createProject: async (body: ProjectCreate) =>
			unwrap(await client.POST("/projects", { body })),

		addProjectMember: async (projectId: string, body: MemberAdd) =>
			unwrap(
				await client.POST("/projects/{project_id}/members", {
					params: { path: { project_id: projectId } },
					body,
				}),
			),

		listDocuments: async (query: DocumentListQuery = {}) =>
			unwrap(await client.GET("/documents", { params: { query } })),

		getDocument: async (documentId: string) =>
			unwrap(
				await client.GET("/documents/{document_id}", {
					params: { path: { document_id: documentId } },
				}),
			),

		// The response always says pending, ingestion runs after it returns.
		// The file as uploaded. Fetched rather than linked to, an <iframe> or
		// <a href> can't carry the bearer token
		getDocumentFile: async (documentId: string) =>
			unwrap(
				await client.GET("/documents/{document_id}/file", {
					params: { path: { document_id: documentId } },
					parseAs: "blob",
				}),
			) as Blob,

		// Poll getDocument to see it reach done or failed
		uploadDocument: async (
			file: File,
			{
				projectId,
				onProgress,
			}: { projectId?: string; onProgress?: (fraction: number) => void } = {},
		): Promise<Document> => {
			const form = new FormData();
			form.append("file", file);
			if (projectId) form.append("project_id", projectId);
			return postWithProgress<Document>("/documents", form, onProgress);
		},

		// A batch of files to be read and sorted into matters. Open it, add each
		// file, seal it once they've all gone, then poll getIntake until it's
		// done and says which matters came out of it
		createIntake: async () => unwrap(await client.POST("/intakes")),

		getIntake: async (intakeId: string) =>
			unwrap(
				await client.GET("/intakes/{intake_id}", {
					params: { path: { intake_id: intakeId } },
				}),
			),

		addIntakeDocument: async (
			intakeId: string,
			file: File,
			onProgress?: (fraction: number) => void,
		): Promise<Document> => {
			const form = new FormData();
			form.append("file", file);
			return postWithProgress<Document>(
				`/intakes/${intakeId}/documents`,
				form,
				onProgress,
			);
		},

		sealIntake: async (intakeId: string) =>
			unwrap(
				await client.POST("/intakes/{intake_id}/seal", {
					params: { path: { intake_id: intakeId } },
				}),
			),

		getPassage: async (documentId: string, chunkIndex: number) =>
			unwrap(
				await client.GET("/documents/{document_id}/passages/{chunk_index}", {
					params: {
						path: { document_id: documentId, chunk_index: chunkIndex },
					},
				}),
			),

		// projectId keeps the answer to one matter's documents
		query: async (question: string, projectId?: string) =>
			unwrap(
				await client.POST("/query", {
					body: { question, project_id: projectId ?? null },
				}),
			),

		// The caller's own past questions and answers, newest first
		listQueries: async (projectRef?: string, limit?: number) =>
			unwrap(
				await client.GET("/queries", {
					params: { query: { project: projectRef, limit } },
				}),
			),

		// sha256 are hex fingerprints of files about to be uploaded, see
		// src/documents/fingerprint.ts
		findDuplicates: async (sha256: string[]) =>
			unwrap(await client.POST("/documents/duplicates", { body: { sha256 } })),

		// name is without the extension, the api keeps the one it was
		// uploaded with. 409 when the matter already has a file called that
		renameDocument: async (documentId: string, name: string) =>
			unwrap(
				await client.PATCH("/documents/{document_id}", {
					params: { path: { document_id: documentId } },
					body: { name },
				}),
			),

		deleteDocument: async (documentId: string) => {
			unwrap(
				await client.DELETE("/documents/{document_id}", {
					params: { path: { document_id: documentId } },
				}),
			);
		},

		// Press across every matter the caller is on, newest first
		listPress: async () => unwrap(await client.GET("/press")),

		listProjectPress: async (projectRef: string, includeDismissed = false) =>
			unwrap(
				await client.GET("/projects/{project_ref}/press", {
					params: {
						path: { project_ref: projectRef },
						query: { include_dismissed: includeDismissed },
					},
				}),
			),

		getPressArticle: async (
			projectRef: string,
			outletSlug: string,
			articleSlug: string,
		) =>
			unwrap(
				await client.GET(
					"/projects/{project_ref}/press/{outlet_slug}/{article_slug}",
					{
						params: {
							path: {
								project_ref: projectRef,
								outlet_slug: outletSlug,
								article_slug: articleSlug,
							},
						},
					},
				),
			),

		// What a pasted link's page says about itself, nothing is saved
		previewPressLink: async (url: string) =>
			unwrap(await client.POST("/press/preview", { body: { url } })),

		addPressLink: async (projectRef: string, url: string) =>
			unwrap(
				await client.POST("/projects/{project_ref}/press", {
					params: { path: { project_ref: projectRef } },
					body: { url },
				}),
			),

		updatePressMention: async (
			projectRef: string,
			mentionId: string,
			status: MentionStatus,
		) =>
			unwrap(
				await client.PATCH("/projects/{project_ref}/press/{mention_id}", {
					params: { path: { project_ref: projectRef, mention_id: mentionId } },
					body: { status },
				}),
			),

		// Reads every feed the matter watches while the caller waits
		refreshPress: async (projectRef: string) =>
			unwrap(
				await client.POST("/projects/{project_ref}/press/refresh", {
					params: { path: { project_ref: projectRef } },
				}),
			),

		getPressTerms: async (projectRef: string) =>
			unwrap(
				await client.GET("/projects/{project_ref}/press/terms", {
					params: { path: { project_ref: projectRef } },
				}),
			),

		setPressTerms: async (projectRef: string, body: PressTerms) =>
			unwrap(
				await client.PUT("/projects/{project_ref}/press/terms", {
					params: { path: { project_ref: projectRef } },
					body,
				}),
			),

		// Firm wide sources, plus one matter's own when it's named
		listPressSources: async (projectRef?: string) =>
			unwrap(
				await client.GET("/press/sources", {
					params: { query: { project: projectRef } },
				}),
			),

		addPressSource: async (body: PressSourceCreate) =>
			unwrap(await client.POST("/press/sources", { body })),

		updatePressSource: async (sourceId: string, body: PressSourceUpdate) =>
			unwrap(
				await client.PATCH("/press/sources/{source_id}", {
					params: { path: { source_id: sourceId } },
					body,
				}),
			),

		deletePressSource: async (sourceId: string) => {
			unwrap(
				await client.DELETE("/press/sources/{source_id}", {
					params: { path: { source_id: sourceId } },
				}),
			);
		},
	};
}

export type Api = ReturnType<typeof createApi>;

// The api's own reason when it gave one, FastAPI puts it in detail as a
// string. Validation errors come back as a list and server errors say nothing
// useful to a person, so both get the fallback
export function errorMessage(error: unknown, fallback: string) {
	if (error instanceof ApiError) {
		if (error.status === 0) return "Couldn't reach the api.";
		if (error.status >= 500) return fallback;
		const detail = (error.body as { detail?: unknown } | null)?.detail;
		if (typeof detail === "string") return detail;
	}
	return fallback;
}

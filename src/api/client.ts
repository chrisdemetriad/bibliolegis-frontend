import createClient, { type Middleware } from "openapi-fetch";
import type { components, paths } from "./schema.gen";

type Schemas = components["schemas"];

export type Document = Schemas["DocumentOut"];
export type Project = Schemas["ProjectOut"];
export type ProjectParty = Schemas["PartyOut"];
export type ProjectDate = Schemas["DateOut"];
export type ProjectCreate = Schemas["ProjectCreate"];
export type ProjectMember = Schemas["ProjectMemberOut"];
export type MemberAdd = Schemas["MemberAdd"];
export type StaffAccount = Schemas["StaffAccount"];
export type UserProfile = Schemas["UserProfile"];
export type ChatModel = Schemas["ChatModelOut"];
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
		// Poll getDocument to see it reach done or failed. XMLHttpRequest rather
		// than fetch because fetch can't report upload progress, and a large
		// scanned bundle can take long enough that a bare spinner looks stuck
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
			const token = await getToken?.();

			return new Promise((resolve, reject) => {
				const xhr = new XMLHttpRequest();
				xhr.open("POST", `${baseUrl}/documents`);
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
		},

		deleteDocument: async (documentId: string) => {
			unwrap(
				await client.DELETE("/documents/{document_id}", {
					params: { path: { document_id: documentId } },
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

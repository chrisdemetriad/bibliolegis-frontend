import createClient, { type Middleware } from "openapi-fetch";
import type { components, paths } from "./schema.gen";

type Schemas = components["schemas"];

export type Document = Schemas["DocumentOut"];
export type Project = Schemas["ProjectOut"];
export type ProjectCreate = Schemas["ProjectCreate"];
export type ProjectMember = Schemas["ProjectMemberOut"];
export type MemberAdd = Schemas["MemberAdd"];
export type StaffAccount = Schemas["StaffAccount"];
export type UserProfile = Schemas["UserProfile"];
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
	// Called before every request. Phase 2 passes Clerk's getToken here
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
		// Poll getDocument to see it reach done or failed
		uploadDocument: async (file: File, projectId?: string) =>
			unwrap(
				await client.POST("/documents", {
					// The generated type says string because OpenAPI describes a
					// file part that way, what goes over the wire is the File
					body: { file: file as unknown as string, project_id: projectId },
					bodySerializer: (body) => {
						const form = new FormData();
						form.append("file", body.file as unknown as File);
						if (body.project_id) form.append("project_id", body.project_id);
						return form;
					},
				}),
			),

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

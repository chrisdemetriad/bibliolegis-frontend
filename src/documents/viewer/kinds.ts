import {
	FileIcon,
	FileSpreadsheetIcon,
	FileTextIcon,
	ImageIcon,
	type LucideIcon,
} from "lucide-react";

export type FileKind = "pdf" | "docx" | "xlsx" | "image";

const kinds: Record<string, FileKind> = {
	pdf: "pdf",
	docx: "docx",
	xlsx: "xlsx",
	jpg: "image",
	jpeg: "image",
	png: "image",
};

// By extension, the same way the api decides what it accepts
export function kindOf(name: string): FileKind | null {
	const extension = name.split(".").pop()?.toLowerCase() ?? "";
	return kinds[extension] ?? null;
}

const icons: Record<FileKind, LucideIcon> = {
	pdf: FileTextIcon,
	docx: FileTextIcon,
	xlsx: FileSpreadsheetIcon,
	image: ImageIcon,
};

export function iconFor(name: string): LucideIcon {
	const kind = kindOf(name);
	return kind ? icons[kind] : FileIcon;
}

// What a file looks like to the viewer, whether it comes from the api or is
// one of the sample matter's stand ins
export type ViewerFile = {
	key: string;
	name: string;
	load: () => Promise<Blob>;
};

export function saveBlob(blob: Blob, name: string) {
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = name;
	link.click();
	// Revoked on the next tick, some browsers haven't started the download by
	// the time click() returns
	setTimeout(() => URL.revokeObjectURL(url));
}

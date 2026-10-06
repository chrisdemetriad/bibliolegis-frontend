// What the api accepts, see ALLOWED_EXTENSIONS in its app/documents.py. It
// checks too, checking here as well means a wrong file is refused straight
// away rather than after it's been sent
export const ACCEPTED = [".pdf", ".docx", ".xlsx", ".jpg", ".jpeg", ".png"];

export const ACCEPTED_LABEL = "PDF, Word, Excel or an image";

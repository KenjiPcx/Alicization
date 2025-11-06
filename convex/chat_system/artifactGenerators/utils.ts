import { v } from "convex/values";

export function base64ToBlob(base64: string, mimeType = 'image/png'): Blob {
    // Remove data URL prefix if present
    const base64Data = base64.replace(/^data:image\/[a-z]+;base64,/, '');

    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);

    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
}

export const artifactGeneratorArgsValidator = v.object({
    artifactId: v.id("artifacts"),
    artifactGroupId: v.string(),
    threadId: v.string(),
    userId: v.string(),
    prompt: v.string(),
    latestArtifactContent: v.optional(v.string()),
    backgroundJobStatusId: v.id("backgroundJobStatuses"),
});
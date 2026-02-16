import { SandpackBlockClient } from "@/app/_components/markdown/blocks/sandpack/SandpackBlockClient";
import type { SandpackPayload } from "@/app/_components/markdown/remark-sandpack";

function fromBase64Url(input: string): string {
    // base64url -> base64
    let b64 = input.replace(/-/g, "+").replace(/_/g, "/");
    // padding 복구
    const pad = b64.length % 4;
    if (pad) b64 += "=".repeat(4 - pad);
    return atob(b64);
}

function safeParsePayload(payloadEncoded?: string): SandpackPayload {
    if (!payloadEncoded) return { setup: {}, files: {} };

    try {
        const json = fromBase64Url(payloadEncoded);
        const parsed = JSON.parse(json) as SandpackPayload;
        return {
            setup:
                typeof parsed.setup === "object" && parsed.setup
                    ? parsed.setup
                    : {},
            files: typeof parsed.files === "object" ? parsed.files : {},
        };
    } catch {
        return { setup: {}, files: {} };
    }
}

export async function SandpackBlock({
    template,
    payloadEncoded,
}: {
    template: "react" | "react-ts";
    payloadEncoded: string;
}) {
    const { setup, files } = safeParsePayload(payloadEncoded);

    return (
        <SandpackBlockClient template={template} setup={setup} files={files} />
    );
}

export async function copyClipboard(text: string): Promise<void> {
    // Clipboard API
    if (navigator.clipboard) {
        return navigator.clipboard.writeText(text);
    }

    // fallback
    const ok = fallbackCopy(text);
    if (!ok) {
        throw new Error("Fallback copy failed!");
    }
}

function fallbackCopy(text: string): boolean {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";

    document.body.appendChild(textarea);
    textarea.select();

    const execResult = document.execCommand("copy");

    document.body.removeChild(textarea);

    return execResult;
}

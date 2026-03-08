export function safeDecodeURIComponent(str: string) {
    try {
        return decodeURIComponent(str);
    } catch {
        return str;
    }
}

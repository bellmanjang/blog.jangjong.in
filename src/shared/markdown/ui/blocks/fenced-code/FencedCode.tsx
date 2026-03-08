import { FencedCodeClient } from "./FencedCodeClient";

export async function FencedCode({
    code,
    lang,
}: {
    code: string;
    lang: string;
}) {
    return <FencedCodeClient code={code} lang={lang} />;
}

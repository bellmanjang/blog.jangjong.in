import { FencedCodeClient } from "@/app/_components/markdown/blocks/fenced-code/FencedCodeClient";

export async function FencedCode({
    code,
    lang,
}: {
    code: string;
    lang: string;
}) {
    return <FencedCodeClient code={code} lang={lang} />;
}

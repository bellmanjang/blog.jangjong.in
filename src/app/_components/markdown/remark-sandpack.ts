import type { SandpackSetup } from "@codesandbox/sandpack-react";
import matter from "gray-matter";
import type { Code, Html } from "mdast";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";

export type SandpackPayload = {
    setup: SandpackSetup;
    files: Record<string, string>;
};

function toBase64Url(input: string): string {
    return Buffer.from(input, "utf8")
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/g, "");
}

function parseSandpackBlock(raw: string): SandpackPayload {
    let setup: SandpackSetup = {};
    let content = raw;

    // 1) setup 섹션 파싱: ---setup 을 --- 로 치환해서 gray-matter로 읽기
    if (raw.startsWith("---setup")) {
        const normalized = raw.replace(/^---setup\s*\n/, "---\n");
        const gm = matter(normalized);
        setup = gm.data;
        content = gm.content;
    }

    // 2) content에서 ---file: 섹션들 파싱
    const files: Record<string, string> = {};
    const lines = content.split("\n");

    let i = 0;

    const isSeparator = (line: string) => line.trim() === "---";
    const fileHeaderRe = /^---file:\s*(.+?)\s*$/;

    while (i < lines.length) {
        const header = lines[i].trim();
        const m = fileHeaderRe.exec(header);

        if (!m) {
            i++;
            continue;
        }

        const filename = m[1].trim();
        if (!filename) {
            i++;
            continue;
        }

        i++; // header 다음 줄부터 파일 내용 시작

        const buf: string[] = [];
        while (i < lines.length && !isSeparator(lines[i])) {
            buf.push(lines[i]);
            i++;
        }

        // 다음 구분자(---) 소비
        if (i < lines.length && isSeparator(lines[i])) i++;

        // 파일 내용 trailing newline 제거
        const fileContent = buf.join("\n").replace(/\n$/, "");
        files[filename] = fileContent;
    }

    // 4) fallback: 파일이 하나도 안 잡히면 App.tsx에 content 통째로
    if (Object.keys(files).length === 0) {
        files["/App.tsx"] = content.replace(/\n$/, "");
    }

    return { setup, files };
}

export const remarkSandpack: Plugin = () => {
    return tree => {
        visit(tree, "code", (node: Code, index, parent: any) => {
            const lang = node.lang ?? "";
            if (!lang.startsWith("sandpack-")) return;
            if (!parent || typeof index !== "number") return;

            const template = lang.substring("sandpack-".length);
            const payload = parseSandpackBlock(node.value);
            const payloadEncoded = toBase64Url(JSON.stringify(payload));

            const htmlNode: Html = {
                type: "html",
                value: `<sandpack data-template="${template}" data-payload="${payloadEncoded}"></sandpack>`,
            };

            parent.children[index] = htmlNode;
        });
    };
};

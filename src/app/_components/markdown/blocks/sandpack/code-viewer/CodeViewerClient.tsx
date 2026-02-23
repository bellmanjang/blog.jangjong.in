"use client";

import { useSandpack } from "@codesandbox/sandpack-react/unstyled";
import { SandpackFencedCodeClient } from "@/app/_components/markdown/blocks/sandpack/code-viewer/SandpackFencedCodeClient";

export const CodeViewerClient = () => {
    const { sandpack } = useSandpack();
    const { files, activeFile } = sandpack;

    const code = files[activeFile].code;
    const lang = activeFile.substring(activeFile.lastIndexOf(".") + 1);

    return <SandpackFencedCodeClient code={code} lang={lang} />;
};

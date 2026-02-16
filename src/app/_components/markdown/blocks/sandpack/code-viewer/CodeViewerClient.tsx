"use client";

import { useSandpack } from "@codesandbox/sandpack-react/unstyled";
import { FencedCodeClient } from "@/app/_components/markdown/blocks/fenced-code/FencedCodeClient";

export const CodeViewerClient = () => {
    const { sandpack } = useSandpack();
    const { files, activeFile } = sandpack;

    const code = files[activeFile].code;
    const lang = activeFile.substring(activeFile.lastIndexOf(".") + 1);

    return (
        <FencedCodeClient
            className="md-sp-fenced-code"
            code={code}
            lang={lang}
            expandable={false}
        />
    );
};

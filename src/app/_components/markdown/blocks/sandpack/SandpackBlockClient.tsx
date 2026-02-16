"use client";

import {
    SandpackLayout,
    SandpackProvider,
} from "@codesandbox/sandpack-react/unstyled";
import { Flex } from "@radix-ui/themes";
import { CodeViewerClient } from "@/app/_components/markdown/blocks/sandpack/code-viewer/CodeViewerClient";
import { FileExplorerClient } from "@/app/_components/markdown/blocks/sandpack/file-explorer/FileExplorerClient";
import { FileTabsClient } from "@/app/_components/markdown/blocks/sandpack/file-tabs/FileTabsClient";
import { PreviewClient } from "@/app/_components/markdown/blocks/sandpack/preview/PreviewClient";
import type { SandpackPayload } from "@/app/_components/markdown/remark-sandpack";

export const SandpackBlockClient = ({
    template,
    setup,
    files,
}: {
    template: "react" | "react-ts";
} & SandpackPayload) => {
    return (
        <SandpackProvider
            template={template}
            customSetup={setup}
            files={files}
            options={{
                classes: {
                    "sp-wrapper": "md-sandpack",
                    "sp-layout": "md-sp-layout",
                    "sp-error": "md-sp-error",
                    "sp-error-message": "md-sp-error-msg",
                },
                initMode: "user-visible",
                recompileMode: "delayed",
            }}
        >
            <SandpackLayout>
                <FileExplorerClient />
                <Flex className="md-sp-viewer-wrapper" direction="column">
                    <FileTabsClient />
                    <CodeViewerClient />
                </Flex>
                <PreviewClient />
            </SandpackLayout>
        </SandpackProvider>
    );
};

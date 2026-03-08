"use client";

import {
    SandpackLayout,
    SandpackProvider,
} from "@codesandbox/sandpack-react/unstyled";
import { Flex } from "@radix-ui/themes";
import dynamic from "next/dynamic";
import type { SandpackPayload } from "../../../model/remark/sandpack";
import { CodeViewerClient } from "./code-viewer/CodeViewerClient";
import { FileExplorerClient } from "./file-explorer/FileExplorerClient";
import { FileTabsClient } from "./file-tabs/FileTabsClient";

const PreviewClient = dynamic(() => import("./preview/PreviewClient"), {
    ssr: false,
});

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
                initMode: "lazy",
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

"use client";

import type { SandpackBundlerFiles } from "@codesandbox/sandpack-client";
import { useSandpack } from "@codesandbox/sandpack-react/unstyled";
import { ScrollArea } from "@radix-ui/themes";
import { useEffect } from "react";
import { ModuleListClient } from "@/app/_components/markdown/blocks/sandpack/file-explorer/ModuleListClient";

export const FileExplorerClient = () => {
    const {
        sandpack: {
            status,
            updateFile,
            deleteFile,
            activeFile,
            files,
            openFile,
            visibleFilesFromProps,
        },
        listen,
    } = useSandpack();

    useEffect(
        function watchFSFilesChanges() {
            if (status !== "running") return;

            const unsubscribe = listen(message => {
                if (message.type === "fs/change") {
                    updateFile(message.path, message.content, false);
                }

                if (message.type === "fs/remove") {
                    deleteFile(message.path, false);
                }
            });

            return unsubscribe;
        },
        [status],
    );

    const orderedFiles = Object.keys(files)
        .sort()
        .reduce<SandpackBundlerFiles>((obj, key) => {
            obj[key] = files[key];
            return obj;
        }, {});

    return (
        <div className="md-sp-file-explorer">
            <ScrollArea className="md-sp-file-explorer-list" scrollbars="both">
                <ModuleListClient
                    activeFile={activeFile}
                    files={orderedFiles}
                    prefixedPath="/"
                    selectFile={openFile}
                    visibleFiles={visibleFilesFromProps}
                />
            </ScrollArea>
        </div>
    );
};

"use client";

import type { SandpackBundlerFiles } from "@codesandbox/sandpack-client";
import type {
    SandpackFileExplorerProp,
    SandpackOptions,
} from "@codesandbox/sandpack-react/unstyled";
import { useState } from "react";
import { FileClient } from "@/app/_components/markdown/blocks/sandpack/file-explorer/FileClient";
import { ModuleListClient } from "@/app/_components/markdown/blocks/sandpack/file-explorer/ModuleListClient";

export interface Props extends SandpackFileExplorerProp {
    prefixedPath: string;
    files: SandpackBundlerFiles;
    selectFile: (path: string) => void;
    activeFile: NonNullable<SandpackOptions["activeFile"]>;
    depth: number;
    visibleFiles: NonNullable<SandpackOptions["visibleFiles"]>;
}

export const DirectoryClient = ({
    prefixedPath,
    files,
    selectFile,
    activeFile,
    depth,
    autoHiddenFiles,
    visibleFiles,
    initialCollapsedFolder,
}: Props) => {
    const [open, setOpen] = useState(
        !initialCollapsedFolder?.includes(prefixedPath),
    );

    const toggle = (): void => setOpen(prev => !prev);

    return (
        <div key={prefixedPath} className="md-sp-file-explorer-dir">
            <FileClient
                depth={depth}
                isDirOpen={open}
                onClick={toggle}
                path={prefixedPath + "/"}
            />

            {open && (
                <ModuleListClient
                    activeFile={activeFile}
                    autoHiddenFiles={autoHiddenFiles}
                    depth={depth + 1}
                    files={files}
                    initialCollapsedFolder={initialCollapsedFolder}
                    prefixedPath={prefixedPath}
                    selectFile={selectFile}
                    visibleFiles={visibleFiles}
                />
            )}
        </div>
    );
};

"use client";

import type { SandpackBundlerFiles } from "@codesandbox/sandpack-client";
import type {
    SandpackFileExplorerProp,
    SandpackOptions,
} from "@codesandbox/sandpack-react/unstyled";
import { DirectoryClient } from "@/app/_components/markdown/blocks/sandpack/file-explorer/DirectoryClient";
import { FileClient } from "@/app/_components/markdown/blocks/sandpack/file-explorer/FileClient";
import { fromPropsToModules } from "@/app/_components/markdown/blocks/sandpack/file-explorer/utils";

export interface ModuleListProps extends SandpackFileExplorerProp {
    prefixedPath: string;
    files: SandpackBundlerFiles;
    selectFile: (path: string) => void;
    activeFile: NonNullable<SandpackOptions["activeFile"]>;
    depth?: number;
    visibleFiles: NonNullable<SandpackOptions["visibleFiles"]>;
}

export const ModuleListClient = ({
    depth = 0,
    activeFile,
    selectFile,
    prefixedPath,
    files,
    autoHiddenFiles,
    visibleFiles,
    initialCollapsedFolder,
}: ModuleListProps) => {
    const { directories, modules } = fromPropsToModules({
        visibleFiles,
        autoHiddenFiles,
        prefixedPath,
        files,
    });

    return (
        <div className="md-sp-file-explorer-dir">
            {directories.map(dir => (
                <DirectoryClient
                    key={dir}
                    activeFile={activeFile}
                    autoHiddenFiles={autoHiddenFiles}
                    depth={depth}
                    files={files}
                    initialCollapsedFolder={initialCollapsedFolder}
                    prefixedPath={dir}
                    selectFile={selectFile}
                    visibleFiles={visibleFiles}
                />
            ))}

            {modules.map(file => (
                <FileClient
                    key={file}
                    active={activeFile === file}
                    depth={depth}
                    path={file}
                    selectFile={selectFile}
                />
            ))}
        </div>
    );
};

"use client";

import { Button, Flex, Text } from "@radix-ui/themes";
import {
    ChevronDown,
    ChevronRight,
    FileIcon,
    FolderClosed,
    FolderOpen,
} from "lucide-react";

export interface Props {
    path: string;
    selectFile?: (path: string) => void;
    active?: boolean;
    onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
    depth: number;
    isDirOpen?: boolean;
}

export const FileClient = ({
    selectFile,
    path,
    active,
    onClick,
    depth,
    isDirOpen,
}: Props) => {
    const onClickButton = (
        event: React.MouseEvent<HTMLButtonElement>,
    ): void => {
        if (selectFile) {
            selectFile(path);
        }

        onClick?.(event);
    };

    const fileName = path.split("/").filter(Boolean).pop();

    const getIcon = () => {
        if (selectFile)
            return (
                <span className="md-sp-file-explorer-icon">
                    <FileIcon size={12} fill={"var(--gray-1)"} />
                </span>
            );

        return isDirOpen ? (
            <>
                <span className="md-sp-file-explorer-icon">
                    <ChevronDown size={14} fill={"var(--gray-1)"} />
                </span>
                <span className="md-sp-file-explorer-icon">
                    <FolderOpen size={12} fill={"var(--gray-1)"} />
                </span>
            </>
        ) : (
            <>
                <span className="md-sp-file-explorer-icon">
                    <ChevronRight size={14} fill={"var(--gray-1)"} />
                </span>
                <span className="md-sp-file-explorer-icon">
                    <FolderClosed size={12} fill={"var(--gray-1)"} />
                </span>
            </>
        );
    };

    return (
        <Button
            color="gray"
            highContrast
            variant="ghost"
            size="1"
            className="md-sp-file-explorer-btn"
            style={{ paddingLeft: `${16 * depth}px` }}
            data-active={active}
            onClick={onClickButton}
            title={fileName}
        >
            <Flex align="center" justify="center">
                {getIcon()}
            </Flex>
            <Text weight="medium">{fileName}</Text>
        </Button>
    );
};

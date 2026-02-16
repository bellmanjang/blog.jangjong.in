"use client";

import { useSandpack } from "@codesandbox/sandpack-react/unstyled";
import { Button, Flex, IconButton, ScrollArea, Text } from "@radix-ui/themes";
import { XIcon } from "lucide-react";
import { useState } from "react";
import {
    calculateNearestUniquePath,
    getFileName,
} from "@/app/_components/markdown/blocks/sandpack/utils/stringUtils";

export const FileTabsClient = () => {
    const { sandpack } = useSandpack();

    const { activeFile, visibleFiles, setActiveFile } = sandpack;
    const [hoveredIndex, setIsHoveredIndex] = useState<null | number>(null);

    const getTriggerText = (currentPath: string): string => {
        const documentFileName = getFileName(currentPath);

        const pathsWithDuplicateFileNames = visibleFiles.reduce(
            (prev, curr) => {
                if (curr === currentPath) {
                    return prev;
                }

                const fileName = getFileName(curr);

                if (fileName === documentFileName) {
                    prev.push(curr);
                    return prev;
                }

                return prev;
            },
            [] as string[],
        );

        if (pathsWithDuplicateFileNames.length === 0) {
            return documentFileName;
        }

        return calculateNearestUniquePath(
            currentPath,
            pathsWithDuplicateFileNames,
        );
    };

    const onKeyDown = ({
        e,
        index,
    }: {
        e: React.KeyboardEvent<HTMLElement>;
        index: number;
    }) => {
        const target = e.currentTarget as HTMLElement;

        switch (e.key) {
            case "ArrowLeft":
                {
                    const leftSibling =
                        target.previousElementSibling as HTMLElement;

                    if (leftSibling) {
                        leftSibling.querySelector("button")?.focus();
                        setActiveFile(visibleFiles[index - 1]);
                    }
                }
                break;
            case "ArrowRight":
                {
                    const rightSibling =
                        target.nextElementSibling as HTMLElement;

                    if (rightSibling) {
                        rightSibling.querySelector("button")?.focus();
                        setActiveFile(visibleFiles[index + 1]);
                    }
                }
                break;
            case "Home": {
                const parent = target.parentElement as HTMLElement;

                const firstChild = parent.firstElementChild as HTMLElement;
                firstChild.querySelector("button")?.focus();
                setActiveFile(visibleFiles[0]);
                break;
            }
            case "End": {
                const parent = target.parentElement as HTMLElement;
                const lastChild = parent.lastElementChild as HTMLElement;
                lastChild.querySelector("button")?.focus();
                setActiveFile(visibleFiles[-1]);
                break;
            }
            default:
                break;
        }
    };

    return (
        <div className="md-sp-tabs" translate="no">
            <ScrollArea scrollbars="horizontal">
                <Flex
                    className="md-sp-tabs-scrollable-container"
                    aria-label="Select active file"
                    role="tablist"
                >
                    {visibleFiles.map((filePath, index) => (
                        <div
                            aria-controls={`${filePath}-tab-panel`}
                            aria-selected={filePath === activeFile}
                            className="md-sp-tab-container"
                            onKeyDown={e => onKeyDown({ e, index })}
                            onMouseEnter={() => setIsHoveredIndex(index)}
                            onMouseLeave={() => setIsHoveredIndex(null)}
                            role="tab"
                            key={filePath}
                        >
                            <Button
                                className="md-sp-tab-button"
                                size="1"
                                color="gray"
                                variant="ghost"
                                data-active={filePath === activeFile}
                                id={`${filePath}-tab`}
                                onClick={(): void => setActiveFile(filePath)}
                                tabIndex={filePath === activeFile ? -1 : 0}
                                title={filePath}
                            >
                                <Text weight="medium">
                                    {getTriggerText(filePath)}
                                </Text>
                            </Button>
                            {visibleFiles.length > 1 && (
                                <IconButton
                                    color="gray"
                                    variant="ghost"
                                    className="md-sp-tab-close-button"
                                    onClick={ev => {
                                        ev.stopPropagation();

                                        sandpack.closeFile(filePath);
                                    }}
                                    style={{
                                        visibility:
                                            filePath === activeFile ||
                                            hoveredIndex === index
                                                ? "visible"
                                                : "hidden",
                                    }}
                                    tabIndex={0}
                                >
                                    <XIcon size="12" />
                                </IconButton>
                            )}
                        </div>
                    ))}
                </Flex>
            </ScrollArea>
        </div>
    );
};

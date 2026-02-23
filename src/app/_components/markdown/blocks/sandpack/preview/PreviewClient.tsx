"use client";

import type { SandpackMessage } from "@codesandbox/sandpack-client";
import {
    ErrorOverlay,
    type PreviewProps,
    type SandpackPreviewRef,
    SandpackStack,
    UnstyledOpenInCodeSandboxButton,
    useSandpackClient,
    useSandpackNavigation,
} from "@codesandbox/sandpack-react/unstyled";
import { Button, IconButton, ScrollArea, Text } from "@radix-ui/themes";
import { ArrowUpRight, RotateCw } from "lucide-react";
import React from "react";
import { LoadingOverlayClient } from "@/app/_components/markdown/blocks/sandpack/preview/LoadingOverlayClient";

export const PreviewClient = React.forwardRef<SandpackPreviewRef, PreviewProps>(
    (
        {
            showNavigator = false,
            showRefreshButton = true,
            showOpenInCodeSandbox = true,
            showSandpackErrorOverlay = true,
            showOpenNewtab = true,
            showRestartButton = true,
            actionsChildren = <></>,
            children,
            startRoute = "/",
        },
        ref,
    ) => {
        const { sandpack, listen, iframe, getClient, clientId } =
            useSandpackClient({ startRoute });
        const [iframeComputedHeight, setComputedAutoHeight] = React.useState<
            number | null
        >(null);
        const { status } = sandpack;
        const { refresh } = useSandpackNavigation(clientId);

        React.useEffect(() => {
            const unsubscribe = listen((message: SandpackMessage) => {
                if (message.type === "resize") {
                    setComputedAutoHeight(message.height);
                }
            });

            return unsubscribe;
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, []);

        React.useImperativeHandle(
            ref,
            () => ({
                clientId: clientId,
                getClient,
            }),
            [getClient, clientId],
        );

        return (
            <SandpackStack className="md-sp-preview">
                <div
                    className="md-sp-preview-container"
                    style={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        background: "white",
                        overflow: "auto",
                        position: "relative",
                    }}
                >
                    <ScrollArea scrollbars="both">
                        <iframe
                            ref={iframe}
                            className="md-sp-preview-iframe"
                            style={{
                                // set height based on the content only in auto mode
                                // and when the computed height was returned by the bundler
                                height: iframeComputedHeight
                                    ? iframeComputedHeight
                                    : undefined,
                            }}
                            title="Sandpack Preview"
                            sandbox={"allow-scripts allow-same-origin"}
                        />
                    </ScrollArea>

                    <div className="md-sp-preview-actions">
                        {actionsChildren}

                        {!showNavigator &&
                            showRefreshButton &&
                            status === "running" && (
                                <IconButton
                                    size="1"
                                    color="gray"
                                    highContrast
                                    variant="surface"
                                    onClick={refresh}
                                    title="Refresh"
                                >
                                    <RotateCw size={12} strokeWidth={2.5} />
                                </IconButton>
                            )}

                        {showOpenInCodeSandbox && (
                            <Button
                                asChild
                                size="1"
                                color="gray"
                                highContrast
                                variant="surface"
                                className="!gap-0"
                            >
                                <UnstyledOpenInCodeSandboxButton>
                                    <Text
                                        className="md-link"
                                        weight="bold"
                                        wrap="nowrap"
                                    >
                                        <ArrowUpRight
                                            className="open-in-new-tab"
                                            strokeLinecap="butt"
                                            size={18}
                                        />
                                        CodeSandbox
                                    </Text>
                                </UnstyledOpenInCodeSandboxButton>
                            </Button>
                        )}
                    </div>

                    <LoadingOverlayClient clientId={clientId} />

                    {showSandpackErrorOverlay && (
                        <ScrollArea
                            className="md-sp-overlay md-sp-error-wrapper"
                            scrollbars="both"
                        >
                            <ErrorOverlay />
                        </ScrollArea>
                    )}

                    {children}
                </div>
            </SandpackStack>
        );
    },
);

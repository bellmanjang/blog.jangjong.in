"use client";

import {
    useLoadingOverlayState,
    useSandpack,
    useSandpackPreviewProgress,
} from "@codesandbox/sandpack-react/unstyled";
import { Button, Flex, ScrollArea, Text } from "@radix-ui/themes";
import { Restart } from "@/app/_components/icons/Restart";
import { Loading } from "@/app/_components/markdown/blocks/sandpack/preview/Loading";

export interface LoadingOverlayProps {
    clientId?: string;
    loading?: boolean;
}

export const LoadingOverlayClient = ({
    clientId,
    loading,
}: LoadingOverlayProps) => {
    const {
        sandpack: { runSandpack, environment },
    } = useSandpack();

    const loadingOverlayState = useLoadingOverlayState(clientId, loading);
    const progressMessage = useSandpackPreviewProgress({ clientId });

    if (loadingOverlayState === "HIDDEN") {
        return null;
    }

    if (loadingOverlayState === "TIMEOUT") {
        return (
            <ScrollArea
                className="md-sp-overlay md-sp-error-wrapper"
                scrollbars="both"
            >
                <div className="md-sp-error">
                    <div className="md-sp-error-msg">
                        <p className="md-sp-error-title">
                            Couldn't connect to server
                        </p>

                        <div className="md-sp-error-msg">
                            <p>
                                This means sandpack cannot connect to the
                                runtime or your network is having some issues.
                                Please check the network tab in your browser and
                                try again. If the problem persists, report it
                                via{" "}
                                <a href="mailto:hello@codesandbox.io?subject=Sandpack Timeout Error">
                                    email
                                </a>{" "}
                                or submit an issue on{" "}
                                <a
                                    href="https://github.com/codesandbox/sandpack/issues"
                                    rel="noreferrer noopener"
                                    target="_blank"
                                >
                                    GitHub.
                                </a>
                            </p>
                        </div>

                        <p className="md-sp-error-msg">
                            ENV: {environment}
                            <br />
                            ERROR: TIME_OUT
                        </p>

                        <div>
                            <Button
                                className="md-sp-error-restart-btn"
                                size="1"
                                color="tomato"
                                variant="ghost"
                                onClick={runSandpack}
                                title="Restart script"
                                type="button"
                            >
                                <Text weight="bold" wrap="nowrap">
                                    <Restart
                                        className="inline-block align-middle"
                                        strokeWidth={1.5}
                                    />{" "}
                                    Try again
                                </Text>
                            </Button>
                        </div>
                    </div>
                </div>
            </ScrollArea>
        );
    }

    const stillLoading =
        loadingOverlayState === "LOADING" ||
        loadingOverlayState === "PRE_FADING";

    return (
        <>
            <div
                className="md-sp-overlay md-sp-loading"
                style={{
                    opacity: stillLoading ? 1 : 0,
                }}
            >
                <Flex
                    className="md-sp-loading-bar"
                    align="center"
                    justify="between"
                >
                    <div className="md-sp-loading-progress">
                        {progressMessage && (
                            <Text as="p">{progressMessage}</Text>
                        )}
                    </div>
                    <Loading />
                </Flex>
            </div>
        </>
    );
};

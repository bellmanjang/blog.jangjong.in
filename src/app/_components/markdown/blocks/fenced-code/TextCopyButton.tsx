import { Box, Button, Text } from "@radix-ui/themes";
import { Check, TriangleAlert } from "lucide-react";
import { useRef, useState } from "react";
import { copyClipboard } from "@/lib/utils/clipboard-util";

export const TextCopyButton = ({ text }: { text: string }) => {
    const [copyStatus, setCopyStatus] = useState<"idle" | "success" | "failed">(
        "idle",
    );
    const timer = useRef<number | undefined>(undefined);

    return (
        <Box className="md-code-copy-btn-wrapper">
            <Button
                size="1"
                color="gray"
                highContrast
                variant="surface"
                onClick={() => {
                    if (copyStatus !== "idle") return;

                    copyClipboard(text)
                        .then(() => setCopyStatus("success"))
                        .catch(() => setCopyStatus("failed"))
                        .finally(() => {
                            window.clearTimeout(timer.current);
                            timer.current = window.setTimeout(
                                () => setCopyStatus("idle"),
                                2000,
                            );
                        });
                }}
            >
                <Text weight="bold">
                    {copyStatus === "idle" && "Copy"}
                    {copyStatus === "success" && (
                        <>
                            <Check
                                className="inline-block align-middle"
                                size={16}
                                strokeWidth={2.5}
                            />{" "}
                            Copied
                        </>
                    )}
                    {copyStatus === "failed" && (
                        <>
                            <TriangleAlert
                                className="inline-block align-middle"
                                size={16}
                                strokeWidth={2.5}
                            />{" "}
                            Copy failed
                        </>
                    )}
                </Text>
            </Button>
        </Box>
    );
};

"use client";

import { Box, Button, Flex, Grid, ScrollArea, Text } from "@radix-ui/themes";
import { type PropsWithChildren, useState } from "react";
import { cx } from "../../lib/class";
import styles from "./ExpandableBox.module.scss";

export const ExpandableBox = ({ children }: PropsWithChildren) => {
    const [expanded, setExpanded] = useState(false);

    return (
        <Grid
            className="relative"
            rows={expanded ? "1fr" : "160px"}
            minHeight="160px"
            maxHeight="70dvh"
        >
            <ScrollArea
                className={
                    expanded ? "pointer-events-auto" : "pointer-events-none"
                }
            >
                {children}
                <Flex
                    className={cx(
                        styles.expandable_box_gradient,
                        "absolute right-0 bottom-0 left-0 p-3",
                    )}
                    justify="center"
                    align="end"
                >
                    <Box className="pointer-events-auto relative bg-[var(--gray-1)]">
                        <Button
                            size="1"
                            color="gray"
                            highContrast
                            variant="surface"
                            onClick={() => setExpanded(cur => !cur)}
                        >
                            <Text weight="bold">
                                {expanded ? "Collapse" : "Expand"}
                            </Text>
                        </Button>
                    </Box>
                </Flex>
            </ScrollArea>
        </Grid>
    );
};

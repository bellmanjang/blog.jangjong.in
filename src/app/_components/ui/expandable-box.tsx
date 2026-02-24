"use client";

import { Box, Button, Flex, Grid, ScrollArea, Text } from "@radix-ui/themes";
import { type PropsWithChildren, useState } from "react";

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
                    className="expandable-box-gradient"
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

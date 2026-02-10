"use client";

import { Box, Button, Flex, Grid, ScrollArea, Text } from "@radix-ui/themes";
import { type PropsWithChildren, useState } from "react";

export const ExpandableBox = ({ children }: PropsWithChildren) => {
    const [expanded, setExpanded] = useState(false);

    return (
        <Grid
            className="expandable-box relative"
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
                <Box height={"64px"} />
                <Flex
                    className="expandable-box-gradient"
                    justify="center"
                    align="end"
                >
                    <Box className="relative bg-white">
                        <Button
                            className="!pointer-events-auto"
                            size="1"
                            highContrast
                            variant="soft"
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

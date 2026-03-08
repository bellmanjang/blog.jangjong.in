import { Text } from "@radix-ui/themes";
import type { Components } from "react-markdown";

export const paragraphRenderer: Components["p"] = props => {
    const { node, color, children, ...rest } = props;

    return (
        <Text as="p" {...rest}>
            {children}
        </Text>
    );
};

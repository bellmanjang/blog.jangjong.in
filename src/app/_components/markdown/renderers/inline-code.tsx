import { Code } from "@radix-ui/themes";
import type { Components } from "react-markdown";

export const inlineCodeRenderer: Components["code"] = props => {
    const { node, color, children, ...rest } = props;

    return (
        <Code className="md-inline-code" variant="soft" highContrast {...rest}>
            {children}
        </Code>
    );
};

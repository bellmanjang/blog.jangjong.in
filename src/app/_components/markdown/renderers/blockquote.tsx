import { Blockquote } from "@radix-ui/themes";
import type { Components } from "react-markdown";

export const blockquoteRenderer: Components["blockquote"] = props => {
    const { node, color, children, ...rest } = props;

    return <Blockquote {...rest}>{children}</Blockquote>;
};

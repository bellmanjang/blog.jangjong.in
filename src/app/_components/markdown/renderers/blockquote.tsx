import { Blockquote } from "@radix-ui/themes";
import type { Components } from "react-markdown";

export const blockquoteRenderer: Components["blockquote"] = props => {
    const { children } = props;

    return <Blockquote>{children}</Blockquote>;
};

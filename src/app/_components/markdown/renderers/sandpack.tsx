import type { Components } from "react-markdown";
import { SandpackBlock } from "@/app/_components/markdown/blocks/sandpack/SandpackBlock";

export const sandpackRenderer: Components["sandpack"] = props => {
    const { ["data-template"]: template, ["data-payload"]: payloadEncoded } =
        props;

    if (!(template && payloadEncoded)) return null;

    return (
        <SandpackBlock template={template} payloadEncoded={payloadEncoded} />
    );
};

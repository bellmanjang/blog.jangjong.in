import type * as React from "react";

declare module "react" {
    namespace JSX {
        interface IntrinsicElements {
            sandpack: React.DetailedHTMLProps<
                React.HTMLAttributes<HTMLElement>,
                HTMLElement
            > & {
                "data-template"?: "react" | "react-ts";
                "data-payload"?: string;
            };
        }
    }
}

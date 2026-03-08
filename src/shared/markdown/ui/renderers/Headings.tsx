import { Heading } from "@radix-ui/themes";
import type { Components } from "react-markdown";
import { cx } from "../../../lib/class";

export function createHeadingRenderer(
    level: 1 | 2 | 3 | 4 | 5 | 6,
): Components[typeof tagName] {
    const tagName = `h${level}` as const;

    return function heading(props) {
        const { node, color, children, id, className, ...rest } = props;

        return (
            <Heading
                as={tagName}
                id={id}
                className={cx("text-balance", className)}
                {...rest}
                tabIndex={-1}
            >
                {children}
            </Heading>
        );
    };
}

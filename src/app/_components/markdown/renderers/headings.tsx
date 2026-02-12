import { Heading } from "@radix-ui/themes";
import Link from "next/link";
import type { Components } from "react-markdown";

export const createHeadingRenderer = (
    level: 1 | 2 | 3 | 4 | 5 | 6,
): Components[typeof tagName] => {
    const tagName = `h${level}` as const;

    return props => {
        const { node, color, children, ...rest } = props;

        return (
            <Heading as={tagName} {...rest}>
                <span className="relative">
                    <Link className="md-anchor" href={`#${props.id}`} />
                    {children}
                </span>
            </Heading>
        );
    };
};

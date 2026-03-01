import { Heading } from "@radix-ui/themes";
import type { Components } from "react-markdown";
import { HeadingsAnchor } from "@/app/_components/markdown/renderers/headings-anchor";
import { cx } from "@/lib/utils/class-util";

export function createHeadingRenderer(
    level: 1 | 2 | 3 | 4 | 5 | 6,
): Components[typeof tagName] {
    const tagName = `h${level}` as const;

    return props => {
        const { node, color, children, id, className, ...rest } = props;

        return (
            <Heading
                as={tagName}
                id={id}
                className={cx("headings", className)}
                {...rest}
                tabIndex={0}
            >
                <span className="relative">
                    <HeadingsAnchor id={id} />
                    {children}
                </span>
            </Heading>
        );
    };
}

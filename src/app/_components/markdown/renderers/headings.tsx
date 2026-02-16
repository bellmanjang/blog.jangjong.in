import { Heading } from "@radix-ui/themes";
import Link from "next/link";
import type { Components } from "react-markdown";
import { cx } from "@/lib/utils/class-util";

export function createHeadingRenderer(
    level: 1 | 2 | 3 | 4 | 5 | 6,
): Components[typeof tagName] {
    const tagName = `h${level}` as const;

    return props => {
        const { node, color, children, className, ...rest } = props;

        return (
            <Heading
                as={tagName}
                className={cx("headings", className)}
                {...rest}
                tabIndex={0}
            >
                <span className="relative">
                    <Link
                        className="md-anchor"
                        href={`#${props.id}`}
                        tabIndex={-1}
                    />
                    {children}
                </span>
            </Heading>
        );
    };
}

import { Link as RadixLink, Text } from "@radix-ui/themes";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import type { Components } from "react-markdown";
import { cx } from "@/lib/utils/class-util";

export const linkRenderer: Components["a"] = props => {
    const { node, color, children, href, ...rest } = props;

    if (!href) return <Text {...rest}>{children}</Text>;

    // App route
    if (href.startsWith("/")) {
        return (
            <RadixLink asChild>
                <Link href={href} {...rest}>
                    {props.target === "_blank" && (
                        <ArrowUpRight
                            className="open-in-new-tab"
                            strokeLinecap="butt"
                        />
                    )}
                    {children}
                </Link>
            </RadixLink>
        );
    }

    // Headings anchor
    if (href.startsWith("#")) {
        return <RadixLink {...rest}>{children}</RadixLink>;
    }

    // GFM Autolinks
    return (
        <RadixLink
            href={href}
            {...rest}
            target="_blank"
            rel="noopener noreferrer"
            className={cx("md-link", rest.className)}
        >
            <ArrowUpRight className="open-in-new-tab" strokeLinecap="butt" />
            {children}
        </RadixLink>
    );
};

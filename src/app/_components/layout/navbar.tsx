import { Flex, ScrollArea, Text } from "@radix-ui/themes";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { ResponsiveLogo } from "@/app/_components/layout/responsive-logo";

interface NavItem {
    name: string;
}

const navItems: { [path: string]: NavItem } = {
    "/posts": {
        name: "Posts",
    },
    "https://jangjong.in": {
        name: "Portfolio",
    },
    "https://github.com/bellmanjang/blog.jangjong.in": {
        name: "Source",
    },
};

export function Navbar() {
    return (
        <aside className="sticky top-0 z-[1000] mb-15 h-[var(--navbar-h)] border-b border-b-[var(--gray-12)] bg-[var(--color-background)] p-1 tracking-tight md:mt-10">
            <nav className="relative flex h-full flex-row items-center gap-[var(--navbar-gap)]">
                <Link
                    href="/"
                    title="Go to Home"
                    className="relative my-auto flex shrink-0 basis-[var(--res-logo-symbol-w)] items-center md:basis-[var(--res-logo-text-w)]"
                >
                    <ResponsiveLogo />
                </Link>
                <ScrollArea type="auto" scrollbars="horizontal">
                    <Flex
                        className="nav-scroll-area"
                        gap="4"
                        wrap="nowrap"
                        height="100%"
                    >
                        {Object.entries(navItems).map(([path, item]) => {
                            const out = !path.startsWith("/");

                            return (
                                <Link
                                    key={path}
                                    href={path}
                                    title={`Go to ${item.name}`}
                                    target={out ? "_blank" : undefined}
                                    className="mx-1 my-auto px-1"
                                >
                                    <Text wrap="nowrap">
                                        {out && (
                                            <ArrowUpRight
                                                className="inline-block align-middle"
                                                strokeLinecap="butt"
                                            />
                                        )}
                                        {item.name}
                                    </Text>
                                </Link>
                            );
                        })}
                    </Flex>
                </ScrollArea>
                <Text
                    size="6"
                    className="nav-blog my-auto shrink-0 basis-[var(--nav-blog-w)] font-extrabold"
                >
                    Blog.
                </Text>
            </nav>
        </aside>
    );
}

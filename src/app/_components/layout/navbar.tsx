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
        <aside className="layout-header">
            <nav className="layout-nav">
                <Link href={"/"} className="nav-home-btn">
                    <ResponsiveLogo />
                </Link>
                <ScrollArea type="auto" scrollbars="horizontal">
                    <Flex className="nav-scroll-area" gap="4" wrap="nowrap">
                        {Object.entries(navItems).map(([path, item]) => {
                            const out = !path.startsWith("/");

                            return (
                                <Link
                                    key={path}
                                    href={path}
                                    target={out ? "_blank" : undefined}
                                    className="nav-item"
                                >
                                    <Text wrap="nowrap">
                                        {out && (
                                            <ArrowUpRight strokeLinecap="butt" />
                                        )}
                                        {item.name}
                                    </Text>
                                </Link>
                            );
                        })}
                    </Flex>
                </ScrollArea>
                <Text size="6" className="nav-blog">
                    Blog.
                </Text>
            </nav>
        </aside>
    );
}

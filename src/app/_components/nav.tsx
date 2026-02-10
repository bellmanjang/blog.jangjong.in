import { Text } from "@radix-ui/themes";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { HomeLogo } from "@/app/_components/home-logo";

interface NavItem {
    name: string;
    target?: string;
}

const navItems: { [path: string]: NavItem } = {
    "/posts": {
        name: "Posts",
    },
    "https://jangjong.in": {
        name: "Portfolio",
        target: "_blank",
    },
};

export function Navbar() {
    return (
        <aside className="sticky top-0 z-[1000] mb-16 border-b border-b-[var(--gray-12)] bg-[var(--color-background)] tracking-tight">
            <nav className="relative flex flex-row items-center">
                <Link
                    href={"/"}
                    className="relative m-1 flex items-center gap-2 py-1 pr-4"
                >
                    <HomeLogo />
                </Link>
                <div className="flex flex-1 flex-row space-x-0">
                    {Object.entries(navItems).map(([path, item]) => {
                        return (
                            <Link
                                key={path}
                                href={path}
                                target={item.target}
                                className="relative m-1 flex items-center gap-2 px-2 py-1"
                            >
                                {item.target === "_blank" && (
                                    <ArrowUpRight strokeLinecap={"butt"} />
                                )}
                                <Text>{item.name}</Text>
                            </Link>
                        );
                    })}
                </div>
                <Text size="6" className="font-black">
                    Blog.
                </Text>
            </nav>
        </aside>
    );
}

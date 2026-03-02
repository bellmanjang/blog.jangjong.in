import "./_styles/reset.css";
import "./_styles/global.scss";
import { ScrollArea, Theme } from "@radix-ui/themes";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";
import { Inconsolata } from "next/font/google";
import localFont from "next/font/local";
import { ThemeProvider } from "next-themes";
import { Navbar } from "@/app/_components/layout/navbar";
import { cx } from "@/lib/utils/class-util";

const pretendard = localFont({
    src: [
        {
            path: "../../public/fonts/Pretendard/Pretendard-Regular.subset.woff2",
            weight: "400",
            style: "normal",
        },
        {
            path: "../../public/fonts/Pretendard/Pretendard-Medium.subset.woff2",
            weight: "500",
            style: "normal",
        },
        {
            path: "../../public/fonts/Pretendard/Pretendard-Bold.subset.woff2",
            weight: "700",
            style: "normal",
        },
        {
            path: "../../public/fonts/Pretendard/Pretendard-ExtraBold.subset.woff2",
            weight: "800",
            style: "normal",
        },
    ],
    variable: "--font-pretendard",
    display: "swap",
    preload: true,
});
const inconsolata = Inconsolata({
    variable: "--font-inconsolata",
    display: "swap",
});

export const metadata: Metadata = {
    metadataBase: process.env.BASE_URL,
    title: {
        default: "Jang Jong-in's Blog",
        template: "%s | Jang Jong-in's Blog",
    },
    description: "느즈막이 시작한 개발자 블로그",
    icons: {
        icon: [
            {
                url: "/favicon-light.svg",
                media: "(prefers-color-scheme: light)",
            },
            {
                url: "/favicon-dark.svg",
                media: "(prefers-color-scheme: dark)",
            },
        ],
    },
    openGraph: {
        title: "Jang Jong-in's Blog",
        description: "느즈막이 시작한 개발자 블로그",
        url: process.env.BASE_URL,
        siteName: "Jang Jong-in's Blog",
        locale: "ko_KR",
        type: "website",
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            "max-video-preview": -1,
            "max-image-preview": "large",
            "max-snippet": -1,
        },
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html
            lang="ko"
            suppressHydrationWarning
            className={cx(
                pretendard.variable,
                inconsolata.variable,
                "overflow-hidden font-sans",
            )}
        >
            <head>
                <link
                    rel="stylesheet"
                    href="https://cdn.jsdelivr.net/npm/katex@0.16.28/dist/katex.min.css"
                    integrity="sha384-Wsr4Nh3yrvMf2KCebJchRJoVo1gTU6kcP05uRSh5NV3sj9+a8IomuJoQzf3sMq4T"
                    crossOrigin="anonymous"
                />
            </head>
            <body>
                <ThemeProvider attribute="class">
                    <Theme accentColor={"grass"} radius={"none"} asChild>
                        <ScrollArea
                            id="app-scrollarea"
                            className="z-0 max-h-dvh"
                            type="auto"
                            scrollbars="vertical"
                            size="2"
                        >
                            <main className="relative flex h-full max-w-[var(--layout-max-w)] flex-col px-[var(--layout-px)] pb-12 lg:mx-auto">
                                <Navbar />
                                {children}
                            </main>
                        </ScrollArea>
                    </Theme>
                </ThemeProvider>
                <Analytics />
                <SpeedInsights />
            </body>
        </html>
    );
}

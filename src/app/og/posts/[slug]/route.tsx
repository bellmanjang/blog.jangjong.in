import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
import { getPostBySlug } from "@/app/_features/posts/api/post-api";
import { formatDate } from "@/lib/utils/date-util";

export async function GET(
    _req: NextRequest,
    ctx: RouteContext<"/og/posts/[slug]">,
) {
    const params = await ctx.params;
    const slug = decodeURIComponent(params.slug);

    const post = getPostBySlug(slug);

    const [PretendardRegular, PretendardExtraBold] = await Promise.all([
        fetch(
            `${process.env.BASE_URL}/fonts/Pretendard/Pretendard-Regular.otf`,
        ).then(res => res.arrayBuffer()),
        fetch(
            `${process.env.BASE_URL}/fonts/Pretendard/Pretendard-ExtraBold.otf`,
        ).then(res => res.arrayBuffer()),
    ]);

    return new ImageResponse(
        <div tw="flex h-full w-full p-5 flex-col justify-between bg-[#F7F9F8] text-[#1A211E]">
            <div tw="flex items-center justify-between mb-10 border-b border-b-black">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="240"
                    height="85"
                    viewBox="0 0 288 102"
                    fill="none"
                >
                    <path
                        d="M76 22L71 17L76 12L81 17L76 22Z"
                        stroke="#1A211E"
                        stroke-width="2"
                        stroke-linecap="square"
                    />
                    <path
                        d="M150 72L145 67L150 62L155 67L150 72Z"
                        stroke="#1A211E"
                        stroke-width="2"
                        stroke-linecap="square"
                    />
                    <path
                        d="M65.5 92C15.5 92 15.5 42 65.5 42C115.5 42 115.5 92 65.5 92Z"
                        stroke="#1A211E"
                        stroke-width="2"
                        stroke-linecap="square"
                    />
                    <path
                        d="M160.5 92C110.5 92 110.5 42 160.5 42C210.5 42 210.5 92 160.5 92Z"
                        stroke="#1A211E"
                        stroke-width="2"
                        stroke-linecap="square"
                    />
                    <path
                        d="M234.5 66C184.5 66 184.5 16 234.5 16C284.5 16 284.5 66 234.5 66Z"
                        stroke="#1A211E"
                        stroke-width="2"
                        stroke-linecap="square"
                    />
                    <path
                        d="M273.5 13V63"
                        stroke="#1A211E"
                        stroke-width="2"
                        stroke-linecap="square"
                    />
                    <path
                        d="M224 39L213.5 87H275.5"
                        stroke="#1A211E"
                        stroke-width="2"
                        stroke-linecap="square"
                    />
                    <path
                        d="M11 17H45"
                        stroke="#1A211E"
                        stroke-width="2"
                        stroke-linecap="square"
                    />
                    <path
                        d="M106 17H174"
                        stroke="#1A211E"
                        stroke-width="2"
                        stroke-linecap="square"
                    />
                    <path
                        d="M11 58L26 18H30L51 74"
                        stroke="#1A211E"
                        stroke-width="2"
                    />
                    <path
                        d="M106 58L121 18H125L135.5 46"
                        stroke="#1A211E"
                        stroke-width="2"
                    />
                </svg>
                <span
                    tw="flex flex-col text-left font-bold text-[96px] tracking-tight"
                    style={{
                        fontFamily: "PretendardExtraBold",
                    }}
                >
                    Blog.
                </span>
            </div>

            {post && (
                <div tw="flex-1 flex flex-col">
                    <span
                        tw="flex flex-col text-left font-bold text-[60px] tracking-tight"
                        style={{
                            fontFamily: "PretendardExtraBold",
                        }}
                    >
                        {post.title}
                    </span>
                    <div
                        tw="flex mt-2 mb-8 text-[24px] text-[#020A00A0]"
                        style={{
                            fontFamily: "PretendardRegular",
                        }}
                    >
                        <span>{formatDate(post.publishedAt)}</span>
                    </div>
                    <article tw="w-full">
                        <blockquote
                            tw="flex flex-col text-left font-bold text-[30px] tracking-tight leading-1.5 mx-0 my-4 pl-3 border-l-4 border-l-[#008f0a4d]"
                            style={{
                                fontFamily: "PretendardRegular",
                            }}
                        >
                            <span>{post.summary}</span>
                        </blockquote>
                    </article>
                </div>
            )}

            <div tw="flex items-end justify-between">
                <div tw="relative flex items-center justify-center w-[268px] h-[60px]">
                    <svg
                        style={{
                            position: "absolute",
                            top: "50%",
                            left: "50%",
                            transform: "translate(-50%, -50%)",
                        }}
                        xmlns="http://www.w3.org/2000/svg"
                        width="100%"
                        height="100%"
                        viewBox="0 0 400 160"
                        fill="none"
                    >
                        <path
                            d="M200 1C259.936 1 309.797 8.49448 344.635 22.1807C379.524 35.8874 399 55.6414 399 80C399 104.359 379.524 124.113 344.635 137.819C309.797 151.506 259.936 159 200 159C140.064 159 90.2028 151.506 55.3652 137.819C20.4756 124.113 1 104.359 1 80C1 55.6414 20.4756 35.8874 55.3652 22.1807C90.2028 8.49448 140.064 1 200 1Z"
                            stroke="black"
                            stroke-width="2"
                        />
                    </svg>
                    <span
                        tw="text-[32px]"
                        style={{
                            fontFamily: "PretendardExtraBold",
                        }}
                    >
                        blog.jangjong.in
                    </span>
                </div>

                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="48"
                    height="48"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1"
                    stroke-linecap="butt"
                    style={{
                        transform: "scale(2.0)",
                    }}
                >
                    <path d="m7 7 10 10" />
                    <path d="M17 7v10H7" />
                </svg>
            </div>
        </div>,
        {
            width: 1200,
            height: 630,
            fonts: [
                {
                    name: "PretendardRegular",
                    data: PretendardRegular,
                },
                {
                    name: "PretendardExtraBold",
                    data: PretendardExtraBold,
                },
            ],
        },
    );
}

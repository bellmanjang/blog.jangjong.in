"use client";

import { Text } from "@radix-ui/themes";
import { Tooltip } from "radix-ui";
import type React from "react";
import { useRef } from "react";
import { preventDefaultAndPushHash } from "@/shared/browser";
import { cx } from "@/shared/lib";
import type { HeadingNode } from "@/shared/markdown";
import { getEdge, type StateVal, type TocLineMeta } from "../lib/toc";
import { useTocStore } from "../store/toc-store";
import {
    activeColor,
    hoverColor,
    inactiveColor,
    PathDrawings,
} from "./PathDrawings";
import styles from "./Toc.module.scss";

type LineCol = { draw: boolean; state: StateVal };

export const TocItem = ({
    depth,
    text,
    id,
    children,
    isRoot,
    isLast,
    parentId,
    lineMask = [],
    meta,
}: HeadingNode & {
    isRoot?: boolean;
    isLast?: boolean;
    parentId?: string;
    lineMask?: LineCol[];
    meta: TocLineMeta;
}) => {
    const ref = useRef<HTMLLIElement>(null);

    const headingsInView = useTocStore(state => state.headingsInView);
    const hoverTocId = useTocStore(state => state.hoverTocId);
    const updateClickTocId = useTocStore(state => state.updateClickTocId);

    const selfActive = headingsInView.has(id);
    const selfHover = id === hoverTocId;
    const selfOrDescState = meta.nodeInPath.get(id) ?? false;

    // 내 뒤쪽 형제들의 state
    const stateInNextSiblings: StateVal = parentId
        ? getEdge(meta.nextSiblingsInPath, parentId, id)
        : false;

    // 자식에게 내려줄 nextLineMask:
    // - draw: 내가 마지막이 아니면 부모 depth 컬럼 세로줄을 그린다
    // - state: 내 뒤쪽 형제들의 state
    const nextLineMask: LineCol[] =
        depth > 1
            ? [...lineMask, { draw: !isLast, state: stateInNextSiblings }]
            : lineMask;

    return (
        <li ref={ref} className="relative transition-all">
            <Tooltip.Root>
                <Tooltip.Trigger asChild>
                    <a
                        data-toc-id={id}
                        className={cx(
                            "relative block w-fit max-w-full px-2 py-0.5",
                            selfActive
                                ? "bg-[var(--accent-a3)]"
                                : selfHover
                                  ? "bg-[var(--focus-a3)] text-[var(--accent-a12)] underline"
                                  : "",
                        )}
                        href={`#${id}`}
                        onClick={e => {
                            updateClickTocId(id);
                            preventDefaultAndPushHash(e, id);
                        }}
                    >
                        {!isRoot && (
                            <span className="pointer-events-none absolute top-1/2 left-0 inline-flex -translate-x-full -translate-y-1/2">
                                {lineMask.map((col, i) => (
                                    <span
                                        key={`${id}-line-${i}`}
                                        className="inline-block h-7 w-0 overflow-hidden transition-all xl:w-5"
                                    >
                                        {col.draw ? (
                                            <PathDrawings.Vertical
                                                state={col.state}
                                            />
                                        ) : (
                                            <PathDrawings.Void />
                                        )}
                                    </span>
                                ))}

                                <span className="inline-block h-7 w-0 overflow-hidden transition-all xl:w-5">
                                    {isLast ? (
                                        <PathDrawings.UpAndRight
                                            state={selfOrDescState}
                                        />
                                    ) : (
                                        <PathDrawings.VerticalAndRight
                                            selfState={selfOrDescState}
                                            pathState={stateInNextSiblings}
                                        />
                                    )}
                                </span>
                            </span>
                        )}
                        <Text className="hidden h-6 overflow-clip text-ellipsis whitespace-nowrap font-medium xl:block">
                            {text}
                        </Text>
                        <Text className="flex h-6 items-center justify-center xl:hidden">
                            <span
                                className="inline-block h-1 w-5 bg-current"
                                style={{
                                    backgroundColor: selfActive
                                        ? activeColor
                                        : selfHover
                                          ? hoverColor
                                          : inactiveColor,
                                }}
                            />
                        </Text>
                    </a>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                    <Tooltip.Content
                        className={cx(
                            styles.toc_tooltip_content,
                            "flex h-7 items-center justify-center bg-[var(--gray-12)]",
                        )}
                        style={
                            {
                                "--depth": depth,
                            } as React.CSSProperties
                        }
                        side="left"
                        sideOffset={5}
                    >
                        <Text className="px-2 font-medium text-[var(--gray-1)] text-sm">
                            {text}
                        </Text>
                        <Tooltip.Arrow className="fill-[var(--gray-12)]" />
                    </Tooltip.Content>
                </Tooltip.Portal>
            </Tooltip.Root>
            {children.length > 0 && (
                <ul className="!pl-0 xl:!pl-5 transition-all">
                    {children.map((item, index) => (
                        <TocItem
                            key={item.id}
                            {...item}
                            isLast={index === children.length - 1}
                            parentId={id}
                            lineMask={nextLineMask}
                            meta={meta}
                        />
                    ))}
                </ul>
            )}
        </li>
    );
};

"use client";

import { handleHeadingsAnchorClick } from "@/app/_components/markdown/anchor";

export function HeadingsAnchor({ id }: { id: string | undefined }) {
    if (id === undefined) return <span className="md-anchor" />;
    return (
        <a
            className="md-anchor"
            href={`#${id}`}
            tabIndex={-1}
            onClick={e => handleHeadingsAnchorClick(e, id)}
        />
    );
}

"use client";

import { Skeleton } from "@radix-ui/themes";
import mermaid from "mermaid";
import { useTheme } from "next-themes";
import { useEffect, useId, useState } from "react";

export function MermaidBlock({ code }: { code: string }) {
    const { resolvedTheme } = useTheme();

    const id = useId();
    const [svg, setSvg] = useState<string>("");

    useEffect(() => {
        if (!resolvedTheme) return;

        let canceled = false;

        (async () => {
            try {
                const { svg } = await mermaid.render(`mermaid-${id}`, code);
                if (!canceled) setSvg(svg);
            } catch (e) {
                if (!canceled) {
                    setSvg(`<pre>Mermaid render error\n${String(e)}</pre>`);
                }
            }
        })();

        return () => {
            canceled = true;
        };
    }, [resolvedTheme, code, id]);

    return (
        <div className="md-fenced-code">
            {svg ? (
                <pre
                    className="md-mermaid"
                    dangerouslySetInnerHTML={{ __html: svg }}
                />
            ) : (
                <Skeleton className="aspect-[4/1]" width="100%" height="auto" />
            )}
        </div>
    );
}

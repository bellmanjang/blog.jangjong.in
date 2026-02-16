"use client";

import mermaid from "mermaid";
import { useEffect, useId, useState } from "react";

export function MermaidBlock({ code }: { code: string }) {
    const id = useId();
    const [svg, setSvg] = useState<string>("");

    useEffect(() => {
        mermaid.initialize({
            startOnLoad: false,
            securityLevel: "strict",
        });

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
    }, [code, id]);

    return <div className="p-2" dangerouslySetInnerHTML={{ __html: svg }} />;
}

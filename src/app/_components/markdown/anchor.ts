export function handleHeadingsAnchorClick(e: React.MouseEvent, id: string) {
    e.preventDefault();

    history.pushState(null, "", `#${id}`);
}

export function scrollToHeadingsAnchor(id: string) {
    const target = document.getElementById(id);
    if (!target) return;

    const viewport = target.closest(
        "[data-radix-scroll-area-viewport]",
    ) as HTMLElement | null;

    if (!viewport) return;

    // viewport 기준 오프셋 계산
    const top =
        target.getBoundingClientRect().top -
        viewport.getBoundingClientRect().top +
        viewport.scrollTop;

    viewport.scrollTo({ top: top - 50, behavior: "smooth" });
}

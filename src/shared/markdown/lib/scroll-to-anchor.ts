export function scrollToTocTarget(id: string, rootSelector = ".article") {
    const root = document.querySelector(rootSelector);
    if (!root) return;

    const section = root.querySelector(
        `section[data-toc-id="${CSS.escape(id)}"]`,
    );
    if (!section) return;

    const heading = section.querySelector("h1,h2,h3,h4,h5,h6");
    const target = (heading ?? section) as HTMLElement;

    target.scrollIntoView({ block: "start", behavior: "smooth" });
}

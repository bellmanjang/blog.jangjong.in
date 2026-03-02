export function handleHeadingsAnchorClick(e: React.MouseEvent, id: string) {
    e.preventDefault();

    history.pushState(null, "", `#${id}`);
}

export function scrollToHeadingsAnchor(id: string) {
    const post = document.querySelector(".post");
    if (!post) return;

    const section = post.querySelector(
        `section[data-toc-id="${CSS.escape(id)}"]`,
    );
    if (!section) return;

    const heading = section.querySelector("h1,h2,h3,h4,h5,h6");
    const target = (heading ?? section) as HTMLElement;

    target.scrollIntoView({ block: "start", behavior: "smooth" });
}

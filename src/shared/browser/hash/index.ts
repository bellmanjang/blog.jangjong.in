function pushHash(id: string) {
    history.pushState(null, "", `#${id}`);
}

export function preventDefaultAndPushHash(e: React.MouseEvent, id: string) {
    e.preventDefault();
    pushHash(id);
}

import type { StateVal } from "@/app/_features/posts/util/toc-util";

export const inactiveColor = "var(--gray-a6)";
export const activeColor = "var(--accent-a11)";
export const hoverColor = "var(--focus-a5)";

const VerticalAndRight = ({
    selfState,
    pathState,
}: {
    selfState: StateVal;
    pathState: StateVal;
}) => {
    return (
        <span className="relative inline-block h-7 w-5">
            <span
                className="absolute top-0 bottom-[12px] left-1/2 inline-block w-1 -translate-x-0.5"
                style={{
                    backgroundColor:
                        selfState === "active" || pathState === "active"
                            ? activeColor
                            : selfState === "hover" || pathState === "hover"
                              ? hoverColor
                              : inactiveColor,
                }}
            />
            <span
                className="absolute top-[12px] bottom-0 left-1/2 inline-block w-1 -translate-x-0.5"
                style={{
                    backgroundColor:
                        pathState === "active"
                            ? activeColor
                            : pathState === "hover"
                              ? hoverColor
                              : inactiveColor,
                }}
            />
            <span
                className="absolute top-1/2 right-0 left-[8px] inline-block h-1 -translate-y-0.5"
                style={{
                    backgroundColor:
                        selfState === "active"
                            ? activeColor
                            : selfState === "hover"
                              ? hoverColor
                              : inactiveColor,
                }}
            />
        </span>
    );
};

const UpAndRight = ({ state }: { state: StateVal }) => {
    return (
        <span className="relative inline-block h-7 w-5">
            <span
                className="absolute top-0 bottom-[12px] left-1/2 inline-block w-1 -translate-x-0.5"
                style={{
                    backgroundColor:
                        state === "active"
                            ? activeColor
                            : state === "hover"
                              ? hoverColor
                              : inactiveColor,
                }}
            />
            <span
                className="absolute top-1/2 right-0 left-[8px] inline-block h-1 -translate-y-0.5"
                style={{
                    backgroundColor:
                        state === "active"
                            ? activeColor
                            : state === "hover"
                              ? hoverColor
                              : inactiveColor,
                }}
            />
        </span>
    );
};

const Vertical = ({ state }: { state: StateVal }) => {
    return (
        <span className="relative inline-block h-7 w-5">
            <span
                className="absolute top-0 bottom-0 left-1/2 inline-block w-1 -translate-x-0.5"
                style={{
                    backgroundColor:
                        state === "active"
                            ? activeColor
                            : state === "hover"
                              ? hoverColor
                              : inactiveColor,
                }}
            />
        </span>
    );
};

const Void = () => {
    return <span className="relative inline-block h-7 w-5" />;
};

export const PathDrawings = {
    VerticalAndRight,
    UpAndRight,
    Vertical,
    Void,
};

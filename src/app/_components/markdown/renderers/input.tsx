import { Checkbox } from "@radix-ui/themes";
import type { Components } from "react-markdown";
import { cx } from "@/lib/utils/class-util";

export const inputRenderer: Components["input"] = props => {
    const { className, checked } = props;

    return (
        <Checkbox
            size="1"
            variant="surface"
            className={cx("md-checkbox", className)}
            checked={checked ?? false}
        />
    );
};

import { Text } from "@radix-ui/themes";
import Image from "next/image";
import type { Components } from "react-markdown";

export const imgRenderer: Components["img"] = props => {
    const { src, alt, width, height, title } = props;

    if (!src || typeof src !== "string") return null;

    return (
        <span
            className="md-image"
            style={{
                width: width || undefined,
                maxWidth: "100%",
                minHeight: !width && height ? height : undefined,
            }}
        >
            <Image
                src={src}
                alt={alt ?? ""}
                width={0}
                height={0}
                sizes={"100vw"}
                style={{
                    width: "100%",
                    height: "100%",
                }}
            />
            {title && (
                <Text
                    className="md-image-caption"
                    size="2"
                    color="gray"
                    wrap="wrap"
                >
                    {title}
                </Text>
            )}
        </span>
    );
};

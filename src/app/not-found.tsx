import { Text } from "@radix-ui/themes";

export default function NotFound() {
    return (
        <section className="flex flex-col gap-8">
            <Text
                className="!tracking-tighter mb-8 text-balance font-extrabold"
                size="9"
            >
                404 - Page Not Found
            </Text>
            <Text>요청한 페이지를 찾을 수 없습니다.</Text>
        </section>
    );
}

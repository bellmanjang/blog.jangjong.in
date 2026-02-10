import { format, parseISO } from "date-fns";

export function formatDate(date: string) {
    const iso_date = parseISO(date);
    return format(iso_date, "yyyy년 M월 d일");
}

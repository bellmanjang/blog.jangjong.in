import fs from "node:fs";
import path from "node:path";
import { readAllPosts } from "@/entities/post";
import { toSearchDoc } from "@/features/search";

const OUT_FILE = path.join(process.cwd(), "_posts", "_index.json");

async function main() {
    const posts = readAllPosts();

    const docs = posts.map(toSearchDoc);

    fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
    fs.writeFileSync(OUT_FILE, JSON.stringify(docs), "utf-8");
    console.log(`✅ wrote ${docs.length} docs -> ${OUT_FILE}`);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});

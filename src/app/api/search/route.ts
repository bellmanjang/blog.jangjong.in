import fs from "node:fs";
import path from "node:path";
import type { NextRequest } from "next/server";
import { readAllPosts } from "@/entities/post";
import type { SearchDoc } from "@/features/search";
import {
    createSearchEngine,
    normalizeText,
    searchDocs,
    toSearchDoc,
} from "@/features/search";
import {
    buildEmptySearchResponse,
    buildSearchResponse,
    parseSearchLimit,
} from "./lib/response";

const SEARCH_INDEX_FILE = path.join(process.cwd(), "_posts", "_index.json");

type SearchIndexCache =
    | {
          kind: "built";
          miniSearch: ReturnType<typeof createSearchEngine>;
          mtimeMs: number;
      }
    | {
          kind: "fallback";
          miniSearch: ReturnType<typeof createSearchEngine>;
          version: string;
      };

let cachedIndex: SearchIndexCache | null = null;

function readBuiltMiniSearch() {
    try {
        const stat = fs.statSync(SEARCH_INDEX_FILE);
        if (
            cachedIndex?.kind === "built" &&
            cachedIndex.mtimeMs === stat.mtimeMs
        ) {
            return cachedIndex.miniSearch;
        }

        const docs = JSON.parse(
            fs.readFileSync(SEARCH_INDEX_FILE, "utf8"),
        ) as SearchDoc[];

        cachedIndex = {
            kind: "built",
            mtimeMs: stat.mtimeMs,
            miniSearch: createSearchEngine(docs),
        };

        return cachedIndex.miniSearch;
    } catch (error) {
        const code = (error as NodeJS.ErrnoException).code;
        if (code === "ENOENT") return null;
        throw error;
    }
}

function getFallbackIndexVersion() {
    const postsDirectory = path.dirname(SEARCH_INDEX_FILE);
    const postFiles = fs
        .readdirSync(postsDirectory)
        .filter(file => path.extname(file) === ".md")
        .sort();

    return postFiles
        .map(file => {
            const stat = fs.statSync(path.join(postsDirectory, file));
            return `${file}:${stat.mtimeMs}`;
        })
        .join("|");
}

function getFallbackMiniSearch() {
    const version = getFallbackIndexVersion();

    if (cachedIndex?.kind === "fallback" && cachedIndex.version === version) {
        return cachedIndex.miniSearch;
    }

    const docs = readAllPosts().map(toSearchDoc);
    const miniSearch = createSearchEngine(docs);

    cachedIndex = {
        kind: "fallback",
        miniSearch,
        version,
    };

    return miniSearch;
}

function getMiniSearch() {
    return readBuiltMiniSearch() ?? getFallbackMiniSearch();
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    const rawQuery = req.nextUrl.searchParams.get("q") ?? "";
    const query = normalizeText(rawQuery);
    const limit = parseSearchLimit(req.nextUrl.searchParams.get("limit"));

    if (!query) {
        return Response.json(buildEmptySearchResponse(query, limit));
    }

    const { total, results } = searchDocs(getMiniSearch(), query, limit);

    return Response.json(
        buildSearchResponse({
            query,
            total,
            limit,
            results,
        }),
    );
}

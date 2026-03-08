import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export type TestContext = {
    after: (fn: () => void) => void;
};

export function createFixture(
    t: TestContext,
    prefix: string,
    structure: Record<string, string>,
): string {
    const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
    t.after(() => fs.rmSync(rootDir, { recursive: true, force: true }));

    for (const [relativePath, content] of Object.entries(structure)) {
        const fileAbs = path.join(rootDir, relativePath);
        fs.mkdirSync(path.dirname(fileAbs), { recursive: true });
        fs.writeFileSync(fileAbs, content);
    }

    return rootDir;
}

export function readFixtureFile(projectRoot: string, entry: string) {
    return fs.readFileSync(path.join(projectRoot, entry), "utf8");
}

export function mergeFsdSettings(
    settings: Record<string, unknown> | undefined,
    sharedOptions: Record<string, unknown> | undefined,
) {
    return {
        ...(settings ?? {}),
        ...(sharedOptions ?? {}),
    };
}

import type { TocNode } from "@/app/_components/markdown/rehype-collect-toc";

export type StateVal = "active" | "hover" | false;

/**
 * 두 상태값을 하나로 합침.
 *
 * 우선순위: "active" > "hover" > false
 * - 둘 중 하나라도 active면 active
 * - active가 없고 둘 중 하나라도 hover면 hover
 * - 둘 다 없으면 false
 */
const mergeState = (a: StateVal, b: StateVal): StateVal => {
    if (a === "active" || b === "active") return "active";
    if (a === "hover" || b === "hover") return "hover";
    return false;
};

type NextSiblingsInPath = Map<string, Map<string, StateVal>>;

/**
 * TOC 트리 렌더링에서 "라인(트리 선) 상태"를 판단하기 위한 메타 정보.
 *
 * 상태값(StateVal)은 다음 의미를 가짐.
 * - "active": 현재 화면에서 활성(관측 중)인 heading 경로에 포함
 * - "hover": hover 경로에 포함 (active가 있으면 active가 우선)
 * - false: 둘 다 아님
 *
 * 1) nodeInPath (node 기준)
 *   각 노드 id에 대해 "이 노드가 경로(path)에 포함되는지"를 StateVal로 저장.
 *   - 노드 자신이 active/hover 이거나
 *   - 후손 중 하나라도 active/hover 이면
 *   nodeInPath[id]는 그 상태 가짐.
 *
 * 2) nextSiblingsInPath (edge 기준)
 *   (부모 id, 자식 id) 쌍에 대해,
 *   "해당 자식의 뒤쪽 형제들(suffix) 서브트리 중 경로 상태가 존재하는지"를 StateVal로 저장.
 *
 *   예) parent.children = [A, B, C] 일 때,
 *   nextSiblingsInPath[parent][A] = mergeState( path(B), path(C) )
 *   nextSiblingsInPath[parent][B] = path(C)
 *   nextSiblingsInPath[parent][C] = false
 *
 *   이 값은 렌더링에서 child의 children을 그릴 때 사용.
 *   child의 자식들이 그릴 "부모 depth 세로줄 컬럼(│)"의 상태를
 *   nextSiblingsInPath[parent][child]로 판단할 수 있음.
 *   - 선을 그릴지(draw) 여부는 '!isLast'로 결정
 *   - 선의 상태(active/hover/none)는 nextSiblingsInPath로 결정
 */
export type TocLineMeta = {
    nodeInPath: Map<string, StateVal>;
    nextSiblingsInPath: NextSiblingsInPath;
};

/**
 * nextSiblingsInPath에 edge(parent -> child)의 상태(StateVal)를 저장.
 *
 * - g: parentId -> (childId -> StateVal) 형태의 2중 Map
 * - p: parentId
 * - c: childId
 * - v: 해당 child 기준 "뒤쪽 형제들(suffix)" 상태
 */
export const setEdge = (
    g: NextSiblingsInPath,
    p: string,
    c: string,
    v: StateVal,
) => {
    let m = g.get(p);
    if (!m) g.set(p, (m = new Map()));
    m.set(c, v);
};

/**
 * nextSiblingsInPath에서 edge(parent -> child) 상태(StateVal)를 조회.
 */
export const getEdge = (g: NextSiblingsInPath, p: string, c: string) =>
    g.get(p)?.get(c) ?? false;

/**
 * TOC 트리를 한 번 순회하면서 line 렌더링에 필요한 메타를 계산.
 *
 * 입력
 * - roots: TOC 루트 노드들
 * - headingsInView: 현재 화면에서 "active"로 간주되는 heading id 집합
 * - hoverTocId: 현재 hover된 TOC 항목 id (없으면 null)
 *
 * 출력
 * - nodeInPath: 모든 노드의 경로 상태(StateVal)
 * - nextSiblingsInPath: 모든 edge(parent->child)에 대한 "child 뒤쪽 형제들(suffix)" 상태(StateVal)
 *
 *
 * 구현 포인트
 * - DFS(Post-order)로 child의 inPath를 먼저 계산해야 parent의 inPath를 알 수 있음.
 * - "뒤쪽 형제들(suffix)" 여부는 children을 뒤에서 앞으로 순회하면 suffix 누적값 하나로 O(k)에 계산 가능.
 *
 * - DFS(Post-order): 자식의 path 상태를 먼저 알아야 부모의 path 상태를 계산할 수 있음.
 * - children을 뒤에서 앞으로 순회하면, suffix(오른쪽 형제들의 상태)를 누적하면서 O(k)에 nextSiblingsInPath를 채울 수 있음.
 * - 상태 누적은 mergeState(우선순위 active > hover > false)를 사용.
 */
export function buildTocLineMeta(
    roots: TocNode[],
    headingsInView: Set<string>,
    hoverTocId: string | null,
): TocLineMeta {
    const nodeInPath = new Map<string, StateVal>();
    const nextSiblingsInPath: NextSiblingsInPath = new Map();

    /**
     * 순환 참조(잘못된 트리) 방어용.
     * 정상적인 TOC 트리라면 cycle이 없어야 하지만, 혹시 모를 플러그인/데이터 오류를 대비.
     */
    const visiting = new Set<string>();

    /**
     * @returns StateVal
     * - "active": node 자신 또는 descendant 중 active 존재
     * - "hover": active는 없고 node 자신 또는 descendant 중 hover 존재
     * - false: 둘 다 없음
     */
    const dfs = (node: TocNode): StateVal => {
        // cycle 방어: 이미 현재 DFS 스택에 있는 노드를 다시 방문하면 순환
        if (visiting.has(node.id)) return false;
        visiting.add(node.id);

        try {
            // node 자체가 active/hover인지 판정
            const selfActive = headingsInView.has(node.id);
            const selfHovered = node.id === hoverTocId;

            // 자식들(descendants) 상태를 우선순위 규칙으로 누적
            let anyChildInPath: StateVal = false;

            // 현재 index i 기준으로, i보다 오른쪽(뒤쪽) 형제들의 경로 상태를 누적한 값
            let suffix: StateVal = false;

            // children을 뒤에서 앞으로 순회하면서:
            // 1) 각 childPath를 계산하고
            // 2) child 기준 suffix 값을 edge로 저장한 뒤
            // 3) suffix/anyChildInPath를 갱신.
            for (let i = node.children.length - 1; i >= 0; i--) {
                const child = node.children[i];
                const childPath = dfs(child);

                // child 기준 "뒤쪽 형제들(suffix)" 상태를 edge로 저장
                setEdge(nextSiblingsInPath, node.id, child.id, suffix);

                // 다음(왼쪽) child를 위해 suffix/anyChildInPath 갱신
                suffix = mergeState(suffix, childPath);
                anyChildInPath = mergeState(anyChildInPath, childPath);
            }

            // node의 self 상태와 descendant 상태를 합쳐 최종 inPath 상태 계산
            const selfState: StateVal = selfActive
                ? "active"
                : selfHovered
                  ? "hover"
                  : false;
            const inPath = mergeState(selfState, anyChildInPath);
            nodeInPath.set(node.id, inPath);

            return inPath;
        } finally {
            visiting.delete(node.id);
        }
    };

    roots.forEach(dfs);
    return { nodeInPath, nextSiblingsInPath };
}

export function flattenTocIds(nodes: TocNode[], out: string[] = []) {
    for (const n of nodes) {
        out.push(n.id);
        if (n.children?.length) flattenTocIds(n.children, out);
    }
    return out;
}

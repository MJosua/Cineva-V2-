export function encodePath(path = []) {
    return path.join(".");
}

export function decodePath(pathKey = "") {
    if (!pathKey) return [];
    return pathKey.split(".").map((s) => Number(s)).filter((n) => !Number.isNaN(n));
}

export function pathsEqual(a = [], b = []) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) return false;
    }
    return true;
}

export function isDescendantPath(parent = [], candidate = []) {
    if (candidate.length <= parent.length) return false;
    for (let i = 0; i < parent.length; i++) {
        if (candidate[i] !== parent[i]) return false;
    }
    return true;
}

export function canHaveChildren(block) {
    return block?.type === "section" || block?.type === "card";
}

export function getChildren(block) {
    return Array.isArray(block?.props?.children) ? block.props.children : [];
}

export function getBlockAtPath(blocks = [], path = []) {
    if (!Array.isArray(path) || path.length === 0) return null;
    let currentList = blocks;
    let currentBlock = null;

    for (let i = 0; i < path.length; i++) {
        const idx = path[i];
        currentBlock = currentList?.[idx];
        if (!currentBlock) return null;
        currentList = getChildren(currentBlock);
    }
    return currentBlock;
}

export function updateBlockAtPath(blocks = [], path = [], updater) {
    if (!Array.isArray(path) || path.length === 0) return blocks;
    const [index, ...rest] = path;
    if (index < 0 || index >= blocks.length) return blocks;

    const clone = [...blocks];
    const current = clone[index];

    if (rest.length === 0) {
        clone[index] = typeof updater === "function" ? updater(current) : updater;
        return clone;
    }

    const currentChildren = getChildren(current);
    const nextChildren = updateBlockAtPath(currentChildren, rest, updater);

    clone[index] = {
        ...current,
        props: {
            ...(current.props || {}),
            children: nextChildren
        }
    };
    return clone;
}

export function removeBlockAtPath(blocks = [], path = []) {
    if (!Array.isArray(path) || path.length === 0) {
        return { blocks, removed: null };
    }

    const [index, ...rest] = path;
    if (index < 0 || index >= blocks.length) {
        return { blocks, removed: null };
    }

    const clone = [...blocks];
    if (rest.length === 0) {
        const [removed] = clone.splice(index, 1);
        return { blocks: clone, removed };
    }

    const current = clone[index];
    const currentChildren = getChildren(current);
    const result = removeBlockAtPath(currentChildren, rest);
    if (!result.removed) return { blocks, removed: null };

    clone[index] = {
        ...current,
        props: {
            ...(current.props || {}),
            children: result.blocks
        }
    };
    return { blocks: clone, removed: result.removed };
}

export function insertBeforePath(blocks = [], targetPath = [], node) {
    if (!Array.isArray(targetPath) || targetPath.length === 0) {
        return { blocks: [...blocks, node], insertedPath: [blocks.length] };
    }

    const parentPath = targetPath.slice(0, -1);
    const targetIndex = targetPath[targetPath.length - 1];

    if (parentPath.length === 0) {
        const next = [...blocks];
        const safeIndex = Math.max(0, Math.min(targetIndex, next.length));
        next.splice(safeIndex, 0, node);
        return { blocks: next, insertedPath: [safeIndex] };
    }

    const parent = getBlockAtPath(blocks, parentPath);
    if (!parent || !canHaveChildren(parent)) {
        return { blocks, insertedPath: null };
    }

    const currentChildren = getChildren(parent);
    const safeIndex = Math.max(0, Math.min(targetIndex, currentChildren.length));
    const nextChildren = [...currentChildren];
    nextChildren.splice(safeIndex, 0, node);

    const nextBlocks = updateBlockAtPath(blocks, parentPath, (current) => ({
        ...current,
        props: {
            ...(current.props || {}),
            children: nextChildren
        }
    }));

    return { blocks: nextBlocks, insertedPath: [...parentPath, safeIndex] };
}

export function insertInsidePath(blocks = [], targetPath = [], node) {
    const target = getBlockAtPath(blocks, targetPath);
    if (!target || !canHaveChildren(target)) {
        return { blocks, insertedPath: null };
    }

    const currentChildren = getChildren(target);
    const insertIndex = currentChildren.length;
    const nextChildren = [...currentChildren, node];

    const nextBlocks = updateBlockAtPath(blocks, targetPath, (current) => ({
        ...current,
        props: {
            ...(current.props || {}),
            children: nextChildren
        }
    }));

    return { blocks: nextBlocks, insertedPath: [...targetPath, insertIndex] };
}

function adjustTargetPathAfterRemoval(sourcePath = [], targetPath = []) {
    const adjusted = [...targetPath];
    const sourceParentLen = sourcePath.length - 1;
    const sourceIndex = sourcePath[sourcePath.length - 1];

    if (
        adjusted.length > sourceParentLen &&
        pathsEqual(adjusted.slice(0, sourceParentLen), sourcePath.slice(0, sourceParentLen)) &&
        adjusted[sourceParentLen] > sourceIndex
    ) {
        adjusted[sourceParentLen] -= 1;
    }

    return adjusted;
}

export function moveBlockByPath(blocks = [], sourcePath = [], targetPath = [], placement = "before") {
    if (!Array.isArray(sourcePath) || !Array.isArray(targetPath) || sourcePath.length === 0 || targetPath.length === 0) {
        return { blocks, movedPath: sourcePath };
    }

    if (pathsEqual(sourcePath, targetPath)) {
        return { blocks, movedPath: sourcePath };
    }

    if (isDescendantPath(sourcePath, targetPath)) {
        return { blocks, movedPath: sourcePath };
    }

    const { blocks: removedTree, removed } = removeBlockAtPath(blocks, sourcePath);
    if (!removed) return { blocks, movedPath: sourcePath };

    const adjustedTargetPath = adjustTargetPathAfterRemoval(sourcePath, targetPath);

    let result;
    if (placement === "inside") {
        result = insertInsidePath(removedTree, adjustedTargetPath, removed);
    } else {
        result = insertBeforePath(removedTree, adjustedTargetPath, removed);
    }

    if (!result.insertedPath) {
        return { blocks, movedPath: sourcePath };
    }

    return { blocks: result.blocks, movedPath: result.insertedPath };
}

export function deleteBlockAtPath(blocks = [], path = []) {
    return removeBlockAtPath(blocks, path).blocks;
}

function stripIdsDeep(block) {
    if (!block || typeof block !== "object") return block;

    const children = getChildren(block);
    const normalizedChildren = children.map((child) => stripIdsDeep(child));
    const { _id, ...withoutId } = block;

    return {
        ...withoutId,
        props: {
            ...(withoutId.props || {}),
            ...(Array.isArray(block?.props?.children) ? { children: normalizedChildren } : {})
        }
    };
}

export function duplicateBlockAtPath(blocks = [], path = []) {
    const target = getBlockAtPath(blocks, path);
    if (!target) return blocks;

    // Deep clone with new IDs
    const duplicate = stripIdsDeep(JSON.parse(JSON.stringify(target)));
    const seed = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const normalized = ensureBlockIds([duplicate], [seed])[0];

    // Insert after
    const targetPathForInsert = [...path];
    targetPathForInsert[targetPathForInsert.length - 1] += 1;

    return insertBeforePath(blocks, targetPathForInsert, normalized).blocks;
}

export function collectCollapsiblePaths(blocks = [], basePath = []) {
    const out = [];
    blocks.forEach((block, index) => {
        const path = [...basePath, index];
        const children = getChildren(block);
        if (canHaveChildren(block) && children.length > 0) {
            out.push(encodePath(path));
            out.push(...collectCollapsiblePaths(children, path));
        }
    });
    return out;
}

export function ensureBlockIds(blocks = [], basePath = []) {
    return (Array.isArray(blocks) ? blocks : []).map((block, index) => {
        const path = [...basePath, index];
        const safePath = path.map((v) => String(v)).join("-").replace(/[^a-zA-Z0-9_-]/g, "_");
        const stableId = block?._id || `block-${safePath || index}`;
        const children = getChildren(block);
        const normalizedChildren = ensureBlockIds(children, path);

        return {
            ...(block || {}),
            _id: stableId,
            props: {
                ...(block?.props || {}),
                ...(children.length > 0 ? { children: normalizedChildren } : {})
            }
        };
    });
}

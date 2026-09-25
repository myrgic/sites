#!/usr/bin/env python3
"""Compute the content hash of a built site artifact.

Hashes the sorted sequence of (relative-path, file-bytes) pairs, each
length-prefixed with an 8-byte big-endian length, over regular files only
(directories and symlinks are skipped). Deterministic regardless of
filesystem walk order, so the same artifact always hashes the same way
wherever it is computed.

Usage: artifact_hash.py <dist-dir>
Prints "sha=<hex>" on stdout (GITHUB_OUTPUT format).
"""
import hashlib
import os
import sys


def artifact_hash(dist_dir: str) -> str:
    rels = []
    for root, _dirs, files in os.walk(dist_dir):
        for name in files:
            path = os.path.join(root, name)
            if not os.path.isfile(path) or os.path.islink(path):
                continue
            rel = os.path.relpath(path, dist_dir).replace(os.sep, "/")
            rels.append(rel)
    rels.sort()

    h = hashlib.sha256()
    for rel in rels:
        rel_bytes = rel.encode("utf-8")
        h.update(len(rel_bytes).to_bytes(8, "big"))
        h.update(rel_bytes)
        with open(os.path.join(dist_dir, rel), "rb") as f:
            data = f.read()
        h.update(len(data).to_bytes(8, "big"))
        h.update(data)
    return h.hexdigest()


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("usage: artifact_hash.py <dist-dir>", file=sys.stderr)
        sys.exit(2)
    print(f"sha={artifact_hash(sys.argv[1])}")

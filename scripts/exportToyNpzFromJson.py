#!/usr/bin/env python3
"""Generate A_csr.npz files from committed A_csr.json payloads."""

from __future__ import annotations

import json
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
DATASETS = [
    ROOT / 'datasets' / 'toy_20x20_linear',
    ROOT / 'datasets' / 'toy_20x20_block',
]


def export_npz(dataset_dir: Path) -> None:
    payload_path = dataset_dir / 'A_csr.json'
    payload = json.loads(payload_path.read_text())

    np.savez(
        dataset_dir / 'A_csr.npz',
        data=np.array(payload['data'], dtype=np.float64),
        indices=np.array(payload['indices'], dtype=np.int32),
        indptr=np.array(payload['indptr'], dtype=np.int32),
        shape=np.array(payload['shape'], dtype=np.int32),
    )


for dataset in DATASETS:
    export_npz(dataset)
    print(f'Wrote {dataset / "A_csr.npz"}')

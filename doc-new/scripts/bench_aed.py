#!/usr/bin/env python3
"""Benchmark the ResNetSE acoustic model on the current machine.

This script measures model loading, first prediction and warm-run latency.
It does not measure accuracy: use an independent labelled test set for that.

Example:
    OMP_NUM_THREADS=6 python scripts/bench_aed.py --threads 6 --runs 100
"""

import argparse
import json
import math
import os
import statistics
import time

import numpy as np
import soundfile as sf
import torch
from macls.predict import MAClsPredictor


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--model-dir", default="backend/py")
    parser.add_argument("--wav", default="/tmp/aiwater_4s.wav")
    parser.add_argument("--threads", type=int, default=6)
    parser.add_argument("--runs", type=int, default=100)
    parser.add_argument("--warmup", type=int, default=10)
    parser.add_argument("--device", default="AMD64 CPU")
    parser.add_argument("--note", default="Synthetic audio; latency only, not an accuracy result.")
    parser.add_argument("--output")
    args = parser.parse_args()

    base = os.path.abspath(args.model_dir)
    if not os.path.exists(args.wav):
        rng = np.random.default_rng(42)
        sf.write(args.wav, (0.1 * rng.standard_normal(4 * 16000)).astype("float32"), 16000)

    torch.set_num_threads(args.threads)
    t0 = time.perf_counter()
    predictor = MAClsPredictor(
        configs=os.path.join(base, "config/resnet_se.yml"),
        model_path=os.path.join(base, "model"),
        use_gpu=False,
        overwrites="dataset_conf.label_list_path=" + os.path.join(base, "dataset/label_list.txt"),
        log_level="error",
    )
    load_ms = (time.perf_counter() - t0) * 1000

    params = sum(p.numel() for p in predictor.predictor.parameters())
    t0 = time.perf_counter()
    result, score = predictor.predict(args.wav)
    first_ms = (time.perf_counter() - t0) * 1000

    for _ in range(args.warmup):
        predictor.predict(args.wav)

    lat = []
    for _ in range(args.runs):
        t0 = time.perf_counter()
        predictor.predict(args.wav)
        lat.append((time.perf_counter() - t0) * 1000)
    lat.sort()

    payload = {
        "device": args.device,
        "torch": torch.__version__,
        "threads": args.threads,
        "runs": args.runs,
        "warmup": args.warmup,
        "params": params,
        "checkpoint_bytes": os.path.getsize(os.path.join(base, "model/model.pth")),
        "load_ms": round(load_ms, 1),
        "first_predict_ms": round(first_ms, 1),
        "warm_p50_ms": round(statistics.median(lat), 1),
        "warm_p95_ms": round(lat[min(len(lat) - 1, math.ceil(len(lat) * 0.95) - 1)], 1),
        "sample_result": {"risk_level": result, "confidence": score},
        "note": args.note,
    }
    text = json.dumps(payload, ensure_ascii=False)
    if args.output:
        with open(args.output, "w", encoding="utf-8") as f:
            f.write(text + "\n")
    print(text)


if __name__ == "__main__":
    main()

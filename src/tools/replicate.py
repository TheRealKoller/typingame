"""Runs image models on Replicate for the art tools under src/tools/ (#143, #151).

Token: REPLICATE_API_TOKEN=r8_... in .env at the repo root (ignored by git).
Every finished prediction is logged as one line to predictions.jsonl next to its image (model version, input, id,
time), so each picture can be traced back. Images that exist already are not generated again.
"""

import base64
import concurrent.futures
import io
import json
import math
import pathlib
import time
import urllib.error
import urllib.request

from PIL import Image, ImageDraw, ImageFont

ROOT = pathlib.Path(__file__).resolve().parents[2]
API = "https://api.replicate.com/v1"

# Pinned versions, so a run can be repeated. FLUX.2 klein 4B, Apache 2.0.
KLEIN_BASE = "2289efa5ebba21f5322ba1b73ac92bb6fec9f34bafc08e0c26f465dac6f8b465"  # black-forest-labs/flux-2-klein-4b-base
KLEIN = "8e9c42d77b10a2a41af823ac4500f7545be6ebc4e745830fc3f3de10de200542"  # black-forest-labs/flux-2-klein-4b

Job = tuple[pathlib.Path, str, dict]


def token() -> str:
    for line in (ROOT / ".env").read_text().splitlines():
        if line.startswith("REPLICATE_API_TOKEN="):
            return line.split("=", 1)[1].strip()
    raise SystemExit("REPLICATE_API_TOKEN missing in .env")


def request(method: str, url: str, body: dict | None = None, wait: bool = False) -> dict:
    headers = {
        "Authorization": f"Bearer {token()}",
        "Content-Type": "application/json",
        # Replicate's edge rejects Python's default user agent.
        "User-Agent": "typingame-art-tools",
    }
    if wait:
        headers["Prefer"] = "wait=60"
    data = json.dumps(body).encode() if body is not None else None
    # Accounts with little credit may only start a few predictions per minute; wait as told and try again.
    for _ in range(20):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, data, headers, method=method), timeout=120) as res:
                return json.load(res)
        except urllib.error.HTTPError as error:
            if error.code != 429:
                raise
            time.sleep(float(error.headers.get("Retry-After") or 10))
    raise RuntimeError(f"{url}: still rate limited")


def predict(version: str, inputs: dict) -> tuple[bytes, dict]:
    """Runs one prediction to the end and returns its output image and the finished prediction."""
    pred = request("POST", f"{API}/predictions", {"version": version, "input": inputs}, wait=True)
    while pred["status"] not in ("succeeded", "failed", "canceled"):
        time.sleep(3)
        pred = request("GET", pred["urls"]["get"])
    if pred["status"] != "succeeded":
        raise RuntimeError(f"{pred['id']}: {pred['status']}: {str(pred.get('error'))[:400]}")
    output = pred["output"]
    url = output[-1] if isinstance(output, list) else output
    with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "typingame-art-tools"}), timeout=120) as res:
        return res.read(), pred


def jpeg_uri(path: pathlib.Path) -> str:
    """Reference images go inline as JPEG data URIs: a 1 megapixel PNG is too big to send."""
    buffer = io.BytesIO()
    Image.open(path).convert("RGB").save(buffer, "JPEG", quality=92)
    return "data:image/jpeg;base64," + base64.b64encode(buffer.getvalue()).decode()


def run(jobs: list[Job], dry_run: bool = False) -> None:
    """Generates every job whose image is missing, four at a time."""
    todo = [job for job in jobs if not job[0].exists()]
    print(f"{len(todo)} of {len(jobs)} images to generate", flush=True)
    if dry_run or not todo:
        return
    logs = {path.parent: (path.parent / "predictions.jsonl").open("a") for path, _, _ in todo}

    def one(job: Job) -> None:
        path, version, inputs = job
        image, pred = predict(version, inputs)
        path.write_bytes(image)
        logged = {k: (v[:40] + "…" if isinstance(v, str) and v.startswith("data:") else v) for k, v in inputs.items()}
        logged |= {"images": [uri[:40] + "…" for uri in inputs["images"]]} if "images" in inputs else {}
        entry = {"file": path.name, "version": version, "id": pred["id"], "input": logged, "metrics": pred.get("metrics")}
        logs[path.parent].write(json.dumps(entry, ensure_ascii=False) + "\n")
        logs[path.parent].flush()

    with concurrent.futures.ThreadPoolExecutor(4) as pool:
        for future in concurrent.futures.as_completed([pool.submit(one, job) for job in todo]):
            if future.exception():
                print("FAILED", future.exception(), flush=True)


def sheet(cells: list[tuple[Image.Image, str]], target: pathlib.Path, columns: int, size: tuple[int, int]) -> None:
    """A contact sheet: each image scaled to `size` with its label below."""
    font = ImageFont.load_default(18)
    w, h = size[0], size[1] + 26
    out = Image.new("RGB", (columns * w, math.ceil(len(cells) / columns) * h), "white")
    draw = ImageDraw.Draw(out)
    for n, (img, label) in enumerate(cells):
        x, y = n % columns * w, n // columns * h
        out.paste(img.convert("RGB").resize(size), (x, y))
        draw.text((x + 4, y + size[1] + 3), label, fill="black", font=font)
    out.save(target, quality=85)

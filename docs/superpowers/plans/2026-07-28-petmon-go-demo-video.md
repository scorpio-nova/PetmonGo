# Petmon Go Demo Video Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce a verified 145–155 second, 1920×1080 narrated Petmon Go demo video from `Petmon Go 路演v7.pptx`, with three embedded product recordings, fixed-style Simplified Chinese subtitles, original light game-like music, and a scannable closing QR code.

**Architecture:** A dependency-free local pipeline extracts PPTX assets into a build manifest, generates time-coded narration/subtitles and offline audio, then renders the video frame-by-frame with Swift, AVFoundation, CoreGraphics, and CoreImage. A separate validator checks duration, dimensions, audio/video tracks, subtitle constraints, sampled frames, and the closing QR code before copying only the final MP4, SRT, and narration transcript to `output/`.

**Tech Stack:** Python 3 standard library, macOS `say`, Swift 6.2, AVFoundation, CoreGraphics, CoreImage, Vision, H.264, AAC.

## Global Constraints

- Final duration: 145–155 seconds.
- Output: 1920×1080, 16:9, 30 fps, H.264 video, AAC audio.
- Preserve each portrait recording’s aspect ratio; do not stretch it or crop required controls.
- Use all three embedded recordings and retain each feature’s complete critical action path.
- Narration: Simplified Chinese, young natural female voice, one voice throughout.
- First voice: macOS `Tingting`; use `Flo（中文，中国大陆）` for the complete narration only if the first render is clearly unnatural.
- Narration copy must remain faithful to PPT notes and visible product behavior; do not invent claims, numbers, or outcomes.
- Burn Simplified Chinese subtitles into the MP4 and export a matching standalone SRT.
- Subtitle font size, weight, and color must remain constant; no keyword color, size, karaoke, or per-word emphasis.
- Subtitle entries use at most two lines and normally at most 18 Chinese characters per line.
- Background music is original, light, warm, and game-like; duck it 10–14 dB beneath narration.
- Use the source deck’s cream paper, black hand-drawn line, map-pin, warning-yellow, rainbow-border, and soft-purple visual language.
- The closing QR code remains static for at least eight seconds and must decode successfully.
- Final deliverables:
  - `output/Petmon-Go-线上演示视频.mp4`
  - `output/Petmon-Go-线上演示视频.srt`
  - `output/Petmon-Go-线上演示视频-旁白稿.txt`

## File Map

- `tools/demo_video/extract_assets.py`: Read PPTX ZIP/XML, map notes and media to slides, and emit the build manifest.
- `tools/demo_video/timeline.json`: Single source of truth for the exact 150-second edit, narration text, subtitle cues, clips, cards, and audio events.
- `tools/demo_video/build_subtitles.py`: Validate narration cues and write SRT/transcript files.
- `tools/demo_video/build_audio.py`: Generate segmented TTS narration, original PCM music/SFX, and a premixed audio master.
- `tools/demo_video/RenderDemo.swift`: Render the full 1920×1080 silent picture master and mux it with the audio master.
- `tools/demo_video/ValidateDemo.swift`: Inspect the final asset, sample frames, and decode the closing QR code.
- `tools/demo_video/build_demo.py`: Orchestrate all stages with resumable build paths and explicit failures.
- `tools/demo_video/tests/test_extract_assets.py`: Extraction and media mapping tests.
- `tools/demo_video/tests/test_subtitles.py`: Timeline, text-width, and SRT tests.
- `tools/demo_video/tests/test_audio.py`: Duration, peak, and ducking-envelope tests.
- `tools/demo_video/tests/test_orchestrator.py`: Dry-run and stage-order tests.
- `.codex_build/demo_video/`: Generated inputs, renders, audio, and QA frames; never stage this directory.
- `output/`: Final deliverables only; do not stage the rendered MP4.

---

### Task 1: Deterministic PPTX Asset Extraction

**Files:**
- Create: `tools/demo_video/extract_assets.py`
- Create: `tools/demo_video/tests/test_extract_assets.py`
- Generate: `.codex_build/demo_video/assets/manifest.json`

**Interfaces:**
- Consumes: `extract_assets(pptx_path: Path, output_dir: Path) -> dict`
- Produces: manifest keys `slides`, `notes`, `videos`, `images`; each video has `slide`, `filename`, `duration`, `width`, `height`, `hasAudio`

- [ ] **Step 1: Write failing extraction tests**

```python
def test_extracts_three_silent_recordings(tmp_path):
    manifest = extract_assets(PPTX, tmp_path)
    assert [(v["slide"], round(v["duration"], 3)) for v in manifest["videos"]] == [
        (2, 46.667), (3, 12.634), (4, 33.267)
    ]
    assert all(v["hasAudio"] is False for v in manifest["videos"])

def test_notes_cover_slides_one_through_five(tmp_path):
    manifest = extract_assets(PPTX, tmp_path)
    assert [Path(item["render"]).name for item in manifest["slides"]] == [
        f"slide-{i}.png" for i in range(1, 7)
    ]
    assert all(manifest["notes"][str(i)].strip() for i in range(1, 6))
    assert manifest["notes"]["6"] == ""
```

- [ ] **Step 2: Run tests and confirm the expected import failure**

Run:

```bash
python3 -m unittest tools.demo_video.tests.test_extract_assets -v
```

Expected: FAIL because `tools.demo_video.extract_assets` does not exist.

- [ ] **Step 3: Implement ZIP/XML extraction and MP4 atom inspection**

Implement:

```python
def extract_assets(pptx_path: Path, output_dir: Path) -> dict:
    """Extract slide renders/media/notes and return a stable JSON manifest."""

def read_mp4_metadata(path: Path) -> dict:
    """Read mvhd/tkhd/hdlr atoms and return duration, dimensions, and track types."""

def slide_media_targets(zip_file: ZipFile, slide_number: int) -> list[str]:
    """Resolve slide relationship targets under ppt/media."""
```

Deduplicate repeated video relationships within a slide, preserve media bytes exactly, normalize notes by joining DrawingML text runs, and write JSON with UTF-8 and sorted keys.

- [ ] **Step 4: Render all six source slides at 1920×1080**

The extractor runs:

```bash
soffice --headless --convert-to pdf --outdir <build>/slides "<source>.pptx"
pdftoppm -png -r 144 "<build>/slides/<source>.pdf" "<build>/slides/slide"
```

Rename `slide-01.png`-style results to the stable names `slide-1.png` through `slide-6.png`, verify every PNG is 1920×1080, and record the absolute render path in `manifest["slides"]`.

- [ ] **Step 5: Run extraction tests**

Run:

```bash
python3 -m unittest tools.demo_video.tests.test_extract_assets -v
```

Expected: PASS; three recordings map to slides 2, 3, and 4 and report no audio track.

- [ ] **Step 6: Generate and inspect the real manifest**

Run:

```bash
python3 tools/demo_video/extract_assets.py \
  --pptx "Petmon Go 路演v7.pptx" \
  --out .codex_build/demo_video/assets
jq '.videos, .notes' .codex_build/demo_video/assets/manifest.json
```

Expected: six 1920×1080 slide renders, notes on slides 1–5, and three unique MP4 assets.

- [ ] **Step 7: Commit**

```bash
git add tools/demo_video/extract_assets.py tools/demo_video/tests/test_extract_assets.py
git commit -m "feat: extract demo video assets"
```

### Task 2: Exact Timeline, Narration, and Fixed-Style Subtitles

**Files:**
- Create: `tools/demo_video/timeline.json`
- Create: `tools/demo_video/build_subtitles.py`
- Create: `tools/demo_video/tests/test_subtitles.py`
- Generate: `.codex_build/demo_video/text/Petmon-Go-线上演示视频.srt`
- Generate: `.codex_build/demo_video/text/Petmon-Go-线上演示视频-旁白稿.txt`

**Interfaces:**
- Consumes: `load_timeline(path: Path) -> dict`
- Produces: `validate_timeline(timeline: dict) -> list[str]`, `write_srt(timeline: dict, path: Path)`, `write_transcript(timeline: dict, path: Path)`

- [ ] **Step 1: Write failing timeline tests**

```python
def test_timeline_is_exactly_150_seconds():
    timeline = load_timeline(TIMELINE)
    assert timeline["duration"] == 150.0
    assert timeline["segments"][0]["start"] == 0.0
    assert timeline["segments"][-1]["end"] == 150.0
    assert not validate_timeline(timeline)

def test_subtitles_use_fixed_style_and_two_lines():
    timeline = load_timeline(TIMELINE)
    styles = {cue["style"] for cue in timeline["subtitles"]}
    assert styles == {"default"}
    assert all(len(cue["lines"]) <= 2 for cue in timeline["subtitles"])
    assert all(len(line) <= 18 for cue in timeline["subtitles"] for line in cue["lines"])
```

- [ ] **Step 2: Run tests and confirm the expected missing-file failure**

Run:

```bash
python3 -m unittest tools.demo_video.tests.test_subtitles -v
```

Expected: FAIL because the timeline and builder do not exist.

- [ ] **Step 3: Create the exact picture timeline**

Use these non-overlapping picture segments:

```json
[
  {"id":"opening","kind":"slide","sourceSlide":1,"start":0.0,"end":18.0},
  {"id":"positioning","kind":"slide","sourceSlide":1,"start":18.0,"end":28.0},
  {"id":"safety-card","kind":"chapter","sourceSlide":2,"start":28.0,"end":30.0},
  {"id":"safety-demo","kind":"video","source":"media1.mp4","start":30.0,"end":60.0,"sourceStart":0.0,"sourceEnd":46.667},
  {"id":"safety-close","kind":"slide","sourceSlide":2,"start":60.0,"end":63.0},
  {"id":"angel-card","kind":"chapter","sourceSlide":3,"start":63.0,"end":65.0},
  {"id":"angel-demo","kind":"video","source":"media2.mp4","start":65.0,"end":77.634,"sourceStart":0.0,"sourceEnd":12.634},
  {"id":"angel-close","kind":"slide","sourceSlide":3,"start":77.634,"end":85.0},
  {"id":"collect-card","kind":"chapter","sourceSlide":4,"start":85.0,"end":87.0},
  {"id":"collect-demo","kind":"video","source":"media3.mp4","start":87.0,"end":116.5,"sourceStart":0.0,"sourceEnd":33.267},
  {"id":"collect-close","kind":"slide","sourceSlide":4,"start":116.5,"end":120.0},
  {"id":"community","kind":"slide","sourceSlide":5,"start":120.0,"end":138.0},
  {"id":"closing","kind":"slide","sourceSlide":6,"start":138.0,"end":150.0}
]
```

- [ ] **Step 4: Add the approved narration copy**

Use seven narration blocks, aligned to the opening, positioning, three product chapters, community value, and closing. Copy must include the four safety event types, Scar’s gift/notification behavior, AI matching and new-profile creation, the Explore/community collaboration direction, and the closing line `记录每一次偶遇，守护同一个街区。`

Split each block into natural subtitle cues. Every cue uses:

```json
{"start":30.4,"end":34.1,"lines":["发现安全风险时，","只要选择事件类型。"],"style":"default"}
```

Keep the total narration body between 420 and 480 Chinese characters after removing punctuation.

- [ ] **Step 5: Implement SRT and transcript generation**

Implement:

```python
def validate_timeline(timeline: dict) -> list[str]:
    """Return concrete validation messages for gaps, overlaps, invalid cue widths, or style drift."""

def srt_timestamp(seconds: float) -> str:
    """Format seconds as HH:MM:SS,mmm."""

def write_srt(timeline: dict, path: Path) -> None:
    """Write numbered UTF-8 SRT entries from cue lines."""
```

- [ ] **Step 6: Run tests and generate text outputs**

Run:

```bash
python3 -m unittest tools.demo_video.tests.test_subtitles -v
python3 tools/demo_video/build_subtitles.py \
  --timeline tools/demo_video/timeline.json \
  --out .codex_build/demo_video/text
```

Expected: PASS; 150-second continuous picture timeline, one subtitle style, no cue wider than two lines or 18 characters per line.

- [ ] **Step 7: Commit**

```bash
git add tools/demo_video/timeline.json tools/demo_video/build_subtitles.py tools/demo_video/tests/test_subtitles.py
git commit -m "feat: define demo narration and subtitles"
```

### Task 3: Offline Narration, Original Music, and Audio Master

**Files:**
- Create: `tools/demo_video/build_audio.py`
- Create: `tools/demo_video/tests/test_audio.py`
- Generate: `.codex_build/demo_video/audio/narration/*.aiff`
- Generate: `.codex_build/demo_video/audio/music.wav`
- Generate: `.codex_build/demo_video/audio/sfx.wav`
- Generate: `.codex_build/demo_video/audio/master.m4a`

**Interfaces:**
- Consumes: `timeline.json` narration blocks and audio events
- Produces: `synthesize_narration(timeline, voice, rate, output_dir) -> list[AudioClip]`, `synthesize_music(duration, sample_rate, output_path)`, `mix_audio(clips, music, sfx, output_path)`

- [ ] **Step 1: Write failing audio tests**

```python
def test_music_is_150_seconds_and_below_peak_limit(tmp_path):
    path = tmp_path / "music.wav"
    synthesize_music(150.0, 48000, path)
    info = inspect_wav(path)
    assert info["duration"] == 150.0
    assert info["peak"] <= 0.45

def test_ducking_reduces_music_during_narration():
    envelope = ducking_envelope(
        duration=10.0,
        narration_ranges=[(2.0, 5.0)],
        fps=100,
        duck_db=-12.0,
    )
    assert max(envelope[250:450]) <= db_to_gain(-11.5)
```

- [ ] **Step 2: Run tests and confirm the expected import failure**

Run:

```bash
python3 -m unittest tools.demo_video.tests.test_audio -v
```

Expected: FAIL because `build_audio` does not exist.

- [ ] **Step 3: Implement original music and SFX synthesis**

Generate 48 kHz stereo PCM using only standard-library `wave`, `math`, `random`, and `struct`. Use a soft pentatonic motif, plucked amplitude envelopes, sparse notes, no strong kick, and deterministic seed `20260728`.

Implement:

```python
def synthesize_music(duration: float, sample_rate: int, output_path: Path) -> None:
    """Write a deterministic warm, light, game-like stereo WAV."""

def synthesize_sfx(events: list[dict], duration: float, output_path: Path) -> None:
    """Write subtle map-pin/chapter chimes at configured timestamps."""
```

- [ ] **Step 4: Implement segmented TTS generation**

For each narration block, run:

```bash
say -v Tingting -r 180 -o <segment>.aiff "<text>"
```

Measure each generated segment with AVFoundation through a small `swift -e` probe. If a segment exceeds its allocated narration window, reduce the corresponding copy first; only then adjust the rate within 175–190.

- [ ] **Step 5: Implement offline audio mixing**

Write PCM mixing that places narration at each block’s exact start time, applies a 150 ms fade in/out, ducks music by 12 dB beneath narration with 200 ms attack and 400 ms release, and limits the final peak to -1 dBFS. Convert the mixed WAV to AAC:

```bash
afconvert master.wav master.m4a -f m4af -d aac -b 192000
```

- [ ] **Step 6: Run tests and inspect the real master**

Run:

```bash
python3 -m unittest tools.demo_video.tests.test_audio -v
python3 tools/demo_video/build_audio.py \
  --timeline tools/demo_video/timeline.json \
  --out .codex_build/demo_video/audio
afinfo .codex_build/demo_video/audio/master.m4a
```

Expected: 150-second AAC master, clear narration, no peak clipping, and music audibly lower during narration.

- [ ] **Step 7: Commit**

```bash
git add tools/demo_video/build_audio.py tools/demo_video/tests/test_audio.py
git commit -m "feat: build demo audio master"
```

### Task 4: Swift Picture Renderer and Final Mux

**Files:**
- Create: `tools/demo_video/RenderDemo.swift`
- Generate: `.codex_build/demo_video/render/picture-silent.mp4`
- Generate: `.codex_build/demo_video/render/Petmon-Go-线上演示视频.mp4`

**Interfaces:**
- Consumes: asset manifest, `timeline.json`, SRT-equivalent cue JSON, `master.m4a`
- Produces: `renderPicture(config: RenderConfig, outputURL: URL) async throws`, `mux(pictureURL: URL, audioURL: URL, outputURL: URL) async throws`

- [ ] **Step 1: Add a renderer self-test before real encoding**

The executable accepts `--self-test` and checks:

```swift
precondition(canvasSize == CGSize(width: 1920, height: 1080))
precondition(frameRate == 30)
precondition(segment(at: 29.0).id == "safety-card")
precondition(segment(at: 30.0).id == "safety-demo")
precondition(segment(at: 149.9).id == "closing")
precondition(subtitleStyle.fontSize == 44)
precondition(subtitleStyle.foreground == CGColor(gray: 1.0, alpha: 1.0))
```

- [ ] **Step 2: Compile and confirm the expected missing-source failure**

Run:

```bash
swiftc tools/demo_video/RenderDemo.swift -o .codex_build/demo_video/bin/render-demo \
  -framework AVFoundation -framework CoreGraphics -framework CoreImage
```

Expected: FAIL because `RenderDemo.swift` does not exist.

- [ ] **Step 3: Implement configuration and frame selection**

Define:

```swift
struct Segment: Decodable {
    let id: String
    let kind: String
    let sourceSlide: Int?
    let source: String?
    let start: Double
    let end: Double
    let sourceStart: Double?
    let sourceEnd: Double?
}

struct SubtitleCue: Decodable {
    let start: Double
    let end: Double
    let lines: [String]
    let style: String
}
```

Map every output frame timestamp to exactly one segment. For recordings, map output time linearly into the configured source range; for slides, use the rendered source slide PNG.

- [ ] **Step 4: Implement the Petmon visual composition**

Use CoreGraphics/CoreImage to:

- fill the 1920×1080 cream canvas;
- draw source slide imagery with aspect-fit;
- draw portrait recordings without stretching;
- add a soft hand-drawn black outline around the phone;
- animate chapter number, map pin, and a short underline over 1.2–1.8 seconds;
- use warning yellow only for safety visuals, rainbow border only for the angel chapter, and soft purple only for collection visuals;
- add fixed subtitle styling: 44 px semibold white text, one constant style, a 70%-opaque charcoal rounded background, centered in the lower safe area;
- move the whole subtitle block upward only when it would cover a defined phone interaction zone.

- [ ] **Step 5: Encode the silent picture master**

Use `AVAssetWriter`, `AVAssetWriterInputPixelBufferAdaptor`, 1920×1080 BGRA pixel buffers, H.264, 30 fps, and 12 Mbps target bitrate. Render exactly 4,500 frames for 150 seconds.

- [ ] **Step 6: Mux the audio master**

Load the silent picture and `master.m4a` into `AVMutableComposition`, then export the final MP4 with the picture transform preserved and the audio trimmed exactly to 150 seconds.

- [ ] **Step 7: Compile, self-test, and render**

Run:

```bash
swiftc tools/demo_video/RenderDemo.swift \
  -o .codex_build/demo_video/bin/render-demo \
  -framework AVFoundation -framework CoreGraphics -framework CoreImage
.codex_build/demo_video/bin/render-demo --self-test
.codex_build/demo_video/bin/render-demo \
  --manifest .codex_build/demo_video/assets/manifest.json \
  --timeline tools/demo_video/timeline.json \
  --audio .codex_build/demo_video/audio/master.m4a \
  --out .codex_build/demo_video/render/Petmon-Go-线上演示视频.mp4
```

Expected: self-test PASS and a playable 150-second MP4 with one video track and one audio track.

- [ ] **Step 8: Commit**

```bash
git add tools/demo_video/RenderDemo.swift
git commit -m "feat: render narrated demo video"
```

### Task 5: Independent Output Validation

**Files:**
- Create: `tools/demo_video/ValidateDemo.swift`
- Generate: `.codex_build/demo_video/qa/frame-*.png`
- Generate: `.codex_build/demo_video/qa/report.json`

**Interfaces:**
- Consumes: final MP4 and standalone SRT
- Produces: `validateAsset(url: URL) async throws -> ValidationReport`, `decodeQRCode(frame: CGImage) throws -> String`

- [ ] **Step 1: Add validator assertions**

The validator fails unless:

```swift
precondition(duration >= 145.0 && duration <= 155.0)
precondition(videoSize == CGSize(width: 1920, height: 1080))
precondition(abs(frameRate - 30.0) < 0.1)
precondition(videoTrackCount == 1)
precondition(audioTrackCount == 1)
precondition(qrPayload.isEmpty == false)
```

It also exports frames at 0, 29, 45, 64, 71, 86, 102, 121, 139, and 146 seconds.

- [ ] **Step 2: Compile and confirm the expected missing-source failure**

Run:

```bash
swiftc tools/demo_video/ValidateDemo.swift \
  -o .codex_build/demo_video/bin/validate-demo \
  -framework AVFoundation -framework Vision -framework CoreImage
```

Expected: FAIL because `ValidateDemo.swift` does not exist.

- [ ] **Step 3: Implement metadata, frame, and QR validation**

Use `AVAsset` to inspect tracks and duration, `AVAssetImageGenerator` for sampled frames, and `VNDetectBarcodesRequest` on the 146-second frame. Write a JSON report containing exact measured values and QR payload.

- [ ] **Step 4: Run validator and inspect sampled frames**

Run:

```bash
.codex_build/demo_video/bin/validate-demo \
  --video .codex_build/demo_video/render/Petmon-Go-线上演示视频.mp4 \
  --srt .codex_build/demo_video/text/Petmon-Go-线上演示视频.srt \
  --out .codex_build/demo_video/qa
python3 /Users/serena/.codex/plugins/cache/openai-primary-runtime/presentations/26.723.12215/skills/presentations/container_tools/create_montage.py \
  --input_dir .codex_build/demo_video/qa \
  --output_file .codex_build/demo_video/qa/contact-sheet.png
```

Expected: validator PASS, QR payload present, ten frame samples exported, and no visible subtitle style drift, stretch, clipping, or obscured phone controls.

- [ ] **Step 5: Commit**

```bash
git add tools/demo_video/ValidateDemo.swift
git commit -m "test: validate demo video output"
```

### Task 6: Resumable Build Orchestrator and Final Delivery

**Files:**
- Create: `tools/demo_video/build_demo.py`
- Create: `tools/demo_video/tests/test_orchestrator.py`
- Create: `tools/demo_video/README.md`
- Generate: final files under `output/`

**Interfaces:**
- Consumes: `BuildPaths`, stage names `extract`, `text`, `audio`, `render`, `validate`, `deliver`
- Produces: `run_pipeline(paths: BuildPaths, from_stage: str | None = None) -> None`

- [ ] **Step 1: Write failing dry-run test**

```python
def test_dry_run_has_stable_stage_order(tmp_path):
    commands = plan_commands(BuildPaths.for_root(tmp_path))
    assert [item.stage for item in commands] == [
        "extract", "text", "audio", "compile-renderer",
        "render", "compile-validator", "validate", "deliver"
    ]
```

- [ ] **Step 2: Run the test and confirm the expected import failure**

Run:

```bash
python3 -m unittest tools.demo_video.tests.test_orchestrator -v
```

Expected: FAIL because `build_demo` does not exist.

- [ ] **Step 3: Implement orchestration and explicit failures**

Implement:

```python
@dataclass(frozen=True)
class BuildPaths:
    root: Path
    pptx: Path
    build: Path
    output: Path

def plan_commands(paths: BuildPaths) -> list[StageCommand]:
    """Return stable commands with named stages and expected output paths."""

def run_pipeline(paths: BuildPaths, from_stage: str | None = None) -> None:
    """Run each stage, stop on non-zero exit, and verify every declared output."""
```

Support `--dry-run` and `--from-stage`; do not delete prior builds. Copy only the final MP4, SRT, and transcript into `output/`.

- [ ] **Step 4: Document the one-command build**

Document:

```bash
python3 tools/demo_video/build_demo.py \
  --pptx "Petmon Go 路演v7.pptx" \
  --build .codex_build/demo_video \
  --output output
```

Also document recovery from a failed render:

```bash
python3 tools/demo_video/build_demo.py \
  --pptx "Petmon Go 路演v7.pptx" \
  --build .codex_build/demo_video \
  --output output \
  --from-stage render
```

- [ ] **Step 5: Run the full automated test suite**

Run:

```bash
python3 -m unittest discover -s tools/demo_video/tests -v
```

Expected: all extraction, timeline, subtitle, audio, and orchestrator tests PASS.

- [ ] **Step 6: Run the full production pipeline**

Run:

```bash
python3 tools/demo_video/build_demo.py \
  --pptx "Petmon Go 路演v7.pptx" \
  --build .codex_build/demo_video \
  --output output
```

Expected: the validator passes and all three final deliverables appear under `output/`.

- [ ] **Step 7: Perform final human QA**

Inspect the contact sheet and the full video. Confirm:

- all three demos show their complete critical action paths;
- subtitles remain one constant size and color;
- narration is natural and matches the actual operation;
- music remains under the voice;
- chapter cards match the source deck;
- the QR code scans on a phone;
- QuickTime and a browser both play the MP4.

- [ ] **Step 8: Commit the reproducible pipeline**

```bash
git add tools/demo_video/build_demo.py tools/demo_video/tests/test_orchestrator.py tools/demo_video/README.md
git commit -m "build: add reproducible demo video pipeline"
```

Do not commit `.codex_build/demo_video/` or the rendered MP4 unless the user explicitly requests repository storage.

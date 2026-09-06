// Runs entirely in the browser via WebAssembly — no API key, no server call,
// no cost. Loaded from a CDN at runtime (like ffmpeg/Whisper elsewhere in
// this codebase) instead of bundled, to avoid bundler issues with packages
// that ship separate Node/browser builds.
const TRANSFORMERS_CDN_URL =
  "https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.2.0/+esm";
const EMBEDDING_MODEL = "Xenova/all-MiniLM-L6-v2";

export type ModelProgress = { status: string; progress?: number; file?: string };

let extractorPromise: Promise<any> | null = null;

async function getExtractor(onProgress?: (p: ModelProgress) => void) {
  if (!extractorPromise) {
    extractorPromise = (async () => {
      const { pipeline } = await import(/* webpackIgnore: true */ TRANSFORMERS_CDN_URL);
      // fp32 rather than a quantized dtype — current onnxruntime-web releases
      // have had bugs with quantized ("q8"/"q4") models failing to load in
      // the WASM backend. fp32 is slightly bigger (~90MB) but reliable.
      return pipeline("feature-extraction", EMBEDDING_MODEL, {
        dtype: "fp32",
        progress_callback: onProgress,
      });
    })();
  }
  return extractorPromise;
}

const BATCH_SIZE = 8;

function yieldToBrowser(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

/** Embeds a batch of texts, returning one 384-dimensional vector per text.
 *  Processes in small batches with yields between them so a large document
 *  doesn't freeze the tab (the browser's "Page Unresponsive" watchdog fires
 *  after the main thread is blocked continuously for a few seconds). */
export async function embedTexts(
  texts: string[],
  onProgress?: (p: ModelProgress) => void
): Promise<number[][]> {
  if (texts.length === 0) return [];
  const extractor = await getExtractor(onProgress);

  const results: number[][] = [];
  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    const output = await extractor(batch, { pooling: "mean", normalize: true });
    results.push(...output.tolist());
    onProgress?.({
      status: "embedding_batch",
      progress: Math.round(((i + batch.length) / texts.length) * 100),
    });
    await yieldToBrowser();
  }
  return results;
}

/** Convenience wrapper for embedding a single piece of text (e.g. a question). */
export async function embedOne(
  text: string,
  onProgress?: (p: ModelProgress) => void
): Promise<number[]> {
  const [vector] = await embedTexts([text], onProgress);
  return vector;
}

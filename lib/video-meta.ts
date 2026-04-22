export type VideoMeta = {
  width: number;
  height: number;
  durationSec: number;
};

/** Extract duration + dimensions from a video file using HTMLVideoElement. */
export function getVideoMetaFromFile(file: File) {
  return new Promise<VideoMeta>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;

    function cleanup() {
      video.removeEventListener("loadedmetadata", onLoaded);
      video.removeEventListener("error", onError);
      URL.revokeObjectURL(url);
    }

    function onLoaded() {
      const meta: VideoMeta = {
        width: video.videoWidth || 1080,
        height: video.videoHeight || 1920,
        durationSec: video.duration || 0,
      };
      cleanup();
      resolve(meta);
    }

    function onError() {
      cleanup();
      reject(new Error("Could not read video metadata. Unsupported format?"));
    }

    video.addEventListener("loadedmetadata", onLoaded);
    video.addEventListener("error", onError);
    video.src = url;
  });
}

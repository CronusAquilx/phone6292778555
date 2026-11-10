/** Called only from the visitor's Accept click; browser permission remains mandatory. */
export async function requestEntireScreen(devices: Pick<MediaDevices, "getDisplayMedia">): Promise<MediaStream> {
  const stream = await devices.getDisplayMedia({ video: { displaySurface: "monitor", frameRate: { ideal: 2, max: 5 } }, audio: false });
  const track = stream.getVideoTracks()[0];
  if (!track || track.getSettings().displaySurface !== "monitor") {
    stream.getTracks().forEach((item) => item.stop());
    throw new Error("Choose Entire screen in the browser's sharing window.");
  }
  return stream;
}
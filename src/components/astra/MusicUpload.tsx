import { useRef, useState } from "react";
import { Music2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { playList, type Track } from "@/lib/music/player";

export function MusicUpload() {
  const { user, guest } = useAuth();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [imported, setImported] = useState("");

  async function importSong(file: File) {
    setError("");
    setImported("");
    if (file.type !== "audio/mpeg" && !/\.mp3$/i.test(file.name)) {
      setError("Choose an MP3 audio file.");
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setError("Choose an MP3 under 50 MB.");
      return;
    }
    setBusy(true);
    try {
      let url: string;
      if (guest || !user) {
        url = URL.createObjectURL(file);
      } else {
        const path = `${user.id}/music-${crypto.randomUUID()}.mp3`;
        const { error: failure } = await supabase.storage.from("backgrounds").upload(path, file, { contentType: "audio/mpeg" });
        if (failure) throw failure;
        const { data, error: linkError } = await supabase.storage.from("backgrounds").createSignedUrl(path, 60 * 60 * 24 * 365);
        if (linkError || !data) throw linkError ?? new Error("Couldn't open the MP3.");
        url = data.signedUrl;
      }
      const title = file.name.replace(/\.mp3$/i, "");
      const track: Track = {
        id: `local-${crypto.randomUUID()}`,
        title,
        artist: "Imported MP3",
        artistId: "local",
        album: "My uploads",
        albumId: "local",
        art: "",
        duration: 0,
        preview: url,
        source: "local",
      };
      await playList([track], 0);
      setImported(title);
    } catch {
      setError("Couldn't import that MP3. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return <div>
    <input ref={input} type="file" accept="audio/mpeg,.mp3" aria-label="Import MP3 music" className="hidden" disabled={busy} onChange={event => {
      const file = event.target.files?.[0];
      if (file) void importSong(file);
      event.target.value = "";
    }}/>
    <Button variant="secondary" disabled={busy} onClick={() => input.current?.click()}><Upload/>{busy ? "Importing…" : "Import MP3"}</Button>
    <p className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground"><Music2 className="mt-0.5 size-3.5 shrink-0"/>{guest ? "Plays now · this visit only" : "Plays now · save it to a playlist in Music"}</p>
    {imported && <p role="status" className="mt-2 text-xs text-success">Now playing: {imported}</p>}
    {error && <p role="alert" className="mt-2 text-xs text-destructive">{error}</p>}
  </div>;
}

import { useRef, useState } from "react";
import { Camera, Trash2, Upload, ImageOff } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "../contexts/AppContext";
import { addPhoto, deletePhoto } from "../lib/data";
import { compressImage } from "../lib/image";
import { formatWeight } from "../lib/units";
import ComparePhotos from "../components/ComparePhotos";

export default function PhotosView() {
  const { uid, photos, stats, unit } = useApp();
  const fileRef = useRef(null);
  const [busy, setBusy] = useState(false);

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please pick an image file");
      return;
    }
    setBusy(true);
    try {
      const dataUrl = await compressImage(file);
      await addPhoto(uid, {
        dataUrl,
        date: new Date().toISOString(),
        weightKg: stats.current ?? null,
      });
      toast.success("Photo added 📸");
    } catch {
      toast.error("Could not add photo");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const remove = async (id) => {
    try {
      await deletePhoto(uid, id);
      toast.success("Photo removed");
    } catch {
      toast.error("Could not delete");
    }
  };

  return (
    <div className="space-y-6" data-testid="photos-view">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-black tracking-tighter">
            Progress photos
          </h1>
          <p className="text-sm text-muted-foreground">
            See how far you've come — pictures don't lie.
          </p>
        </div>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          data-testid="add-photo-btn"
          className="flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          <Upload className="h-4 w-4" />
          {busy ? "Uploading…" : "Add photo"}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onFile}
          data-testid="photo-file-input"
        />
      </div>

      <ComparePhotos />

      {photos.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center rounded-[var(--radius)] border border-dashed border-border bg-card py-20 text-center"
          data-testid="photos-empty"
        >
          <ImageOff className="h-10 w-10 text-muted-foreground" />
          <p className="mt-4 font-semibold">No photos yet</p>
          <p className="mt-1 max-w-xs text-sm text-muted-foreground">
            Add your first progress photo to start your visual timeline.
          </p>
        </div>
      ) : (
        <div
          className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
          data-testid="photos-grid"
        >
          {photos.map((p) => (
            <div
              key={p.id}
              className="group relative overflow-hidden rounded-[var(--radius)] border bg-card"
              data-testid="photo-card"
            >
              <img
                src={p.dataUrl}
                alt="progress"
                className="aspect-[3/4] w-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                <p className="text-xs font-semibold text-white">
                  {new Date(p.date).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
                {p.weightKg != null && (
                  <p className="text-[11px] text-white/80">
                    {formatWeight(p.weightKg, unit)}
                  </p>
                )}
              </div>
              <button
                onClick={() => remove(p.id)}
                data-testid={`delete-photo-${p.id}`}
                className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity hover:bg-destructive group-hover:opacity-100"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <Camera className="h-3.5 w-3.5" /> Photos are stored privately in your own
        account.
      </p>
    </div>
  );
}

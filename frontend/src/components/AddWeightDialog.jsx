import { useState } from "react";
import { Plus, Pencil } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApp } from "../contexts/AppContext";
import { addWeight, updateWeight } from "../lib/data";
import { fromDisplay, toDisplay, unitLabel } from "../lib/units";

// Used both for adding a new entry and editing an existing one.
// Pass `existing` prop with a weight object to enter edit mode.
export default function AddWeightDialog({ trigger, defaultDate, existing, onClose }) {
  const { uid, unit } = useApp();
  const isEdit = !!existing;

  const [open, setOpen] = useState(!!existing);
  const [value, setValue] = useState(
    existing ? String(parseFloat(toDisplay(existing.weightKg, unit).toFixed(1))) : "",
  );
  const [date, setDate] = useState(
    existing
      ? new Date(existing.date).toISOString().slice(0, 10)
      : defaultDate || new Date().toISOString().slice(0, 10),
  );
  const [note, setNote] = useState(existing?.note || "");
  const [busy, setBusy] = useState(false);

  const handleOpenChange = (val) => {
    setOpen(val);
    if (!val && onClose) onClose();
  };

  const submit = async (e) => {
    e.preventDefault();
    const weightKg = fromDisplay(value, unit);
    if (weightKg == null || weightKg <= 0) {
      toast.error("Enter a valid weight");
      return;
    }
    setBusy(true);
    try {
      if (isEdit) {
        await updateWeight(uid, existing.id, { weightKg, date: new Date(date).toISOString(), note });
        toast.success("Entry updated ✏️");
      } else {
        await addWeight(uid, { weightKg, date: new Date(date).toISOString(), note });
        toast.success("Weigh-in logged 💪");
      }
      setValue("");
      setNote("");
      handleOpenChange(false);
    } catch {
      toast.error("Could not save. Check your connection / Firestore rules.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {!isEdit && (
        <DialogTrigger asChild>
          {trigger || (
            <Button
              data-testid="open-add-weight"
              className="rounded-full bg-primary px-6 font-semibold text-primary-foreground hover:opacity-90"
            >
              <Plus className="mr-2 h-4 w-4" /> Log weight
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent data-testid="add-weight-dialog">
        <DialogHeader>
          <DialogTitle className="font-heading">
            {isEdit ? "Edit weigh-in" : "Log a weigh-in"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label htmlFor="w-value">Weight ({unitLabel(unit)})</Label>
            <Input
              id="w-value"
              data-testid="weight-input"
              type="number"
              step="0.1"
              inputMode="decimal"
              placeholder={`e.g. ${unit === "lbs" ? "160.0" : "72.5"}`}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              autoFocus
            />
          </div>
          <div>
            <Label htmlFor="w-date">Date</Label>
            <Input
              id="w-date"
              data-testid="weight-date"
              type="date"
              value={date}
              max={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="w-note">Note (optional)</Label>
            <Input
              id="w-note"
              data-testid="weight-note"
              placeholder="How are you feeling?"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              type="submit"
              disabled={busy}
              data-testid="submit-weight"
              className="rounded-full bg-primary font-semibold text-primary-foreground hover:opacity-90"
            >
              {busy ? "Saving…" : isEdit ? "Update" : "Save weigh-in"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

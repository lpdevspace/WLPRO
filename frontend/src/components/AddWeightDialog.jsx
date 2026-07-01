import { useState } from "react";
import { Plus } from "lucide-react";
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
import { addWeight } from "../lib/data";
import { fromDisplay, unitLabel } from "../lib/units";

export default function AddWeightDialog({ trigger, defaultDate }) {
  const { uid, unit } = useApp();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [date, setDate] = useState(
    defaultDate || new Date().toISOString().slice(0, 10),
  );
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const weightKg = fromDisplay(value, unit);
    if (weightKg == null || weightKg <= 0) {
      toast.error("Enter a valid weight");
      return;
    }
    setBusy(true);
    try {
      await addWeight(uid, {
        weightKg,
        date: new Date(date).toISOString(),
        note,
      });
      toast.success("Weigh-in logged 💪");
      setValue("");
      setNote("");
      setOpen(false);
    } catch (err) {
      toast.error("Could not save. Check your connection / Firestore rules.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
      <DialogContent data-testid="add-weight-dialog">
        <DialogHeader>
          <DialogTitle className="font-heading">Log a weigh-in</DialogTitle>
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
              {busy ? "Saving…" : "Save weigh-in"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

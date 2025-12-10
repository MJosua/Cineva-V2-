import React, { useState, useEffect, useMemo } from "react";
import { useDispatch } from "react-redux";
import { useAppSelector } from "@/hooks/useAppSelector";
import { fetchMeetingBookings, fetchMeetingRooms } from "@/store/slices/meetingroom_slice";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, AlertCircle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WidgetProps } from "@/types/widgetTypes";

// Generate 30-minute slots (08:00–17:30)
const timeSlots = Array.from({ length: 18 }, (_, i) => {
  const hour = 8 + Math.floor(i / 2);
  const minutes = i % 2 === 0 ? "00" : "30";
  return `${hour.toString().padStart(2, "0")}:${minutes}`;
});

function getNextFiveWeekdays(startDate = new Date()) {
  const days: string[] = [];
  const date = new Date(startDate);
  while (days.length < 5) {
    if (date.getDay() !== 0 && date.getDay() !== 6) {
      days.push(date.toISOString().split("T")[0]);
    }
    date.setDate(date.getDate() + 1);
  }
  return days;
}

const GanttRoomUsage: React.FC<WidgetProps> = ({ formData = {}, setGlobalValues }) => {
  const dispatch = useDispatch();
  const { bookings, rooms, loading } = useAppSelector((state) => state.meetingroom);

  console.log("rooms",rooms)

  useEffect(() => {
    dispatch(fetchMeetingRooms());
    dispatch(fetchMeetingBookings());
  }, [dispatch]);

  const [selectedRoom, setSelectedRoom] = useState<string>("");
  const [userSelection, setUserSelection] = useState<{ date?: string; start?: string; end?: string }>({});
  const [mode, setMode] = useState<"drag" | "click-range" | "modal">("drag");
  const [dragState, setDragState] = useState<{ date?: string; startIdx?: number; endIdx?: number } | null>(null);
  const [clickPending, setClickPending] = useState<{ date: string; idx: number } | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalDate, setModalDate] = useState<string | null>(null);
  const [modalStartIdx, setModalStartIdx] = useState<number>(0);
  const [modalEndIdx, setModalEndIdx] = useState<number>(0);
  const [warning, setWarning] = useState<string | null>(null);

  const visibleDates = getNextFiveWeekdays();

  // 🔁 Auto mode (responsive interaction)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) setMode("modal");
      else if ("ontouchstart" in window) setMode("click-range");
      else setMode("drag");
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Keep widget in sync with parent form
  useEffect(() => {
    if (formData["room"] && formData["room"] !== selectedRoom) {
      setSelectedRoom(formData["room"]);
    }
  }, [formData["room"]]);

  // Rooms list
  const roomList = useMemo(() => rooms.map((r) => r.room_name), [rooms]);

  const timeToIndex = (time?: string) => {
    if (!time) return 0;
    const [h, m] = time.split(":").map(Number);
    return (h - 8) * 2 + (m >= 30 ? 1 : 0);
  };

  // ⚙️ Show warning
  const warnIfNoRoom = () => {
    if (!selectedRoom) {
      setWarning("⚠️ Please select a room before booking a time slot.");
      setTimeout(() => setWarning(null), 2500);
      return true;
    }
    return false;
  };

  // ✅ Finalize selection
  const finalizeSelection = (dateStr: string, startIdx: number, endIdx: number) => {
    const start = timeSlots[Math.min(startIdx, endIdx)];
    const end = timeSlots[Math.max(startIdx, endIdx) + 1] || "17:30";
    setGlobalValues?.((prev) => ({
      ...prev,
      room: selectedRoom,
      date: dateStr,
      start_time: start,
      end_time: end,
    }));
    setUserSelection({ date: dateStr, start, end });
    setDragState(null);
    setClickPending(null);
    setModalOpen(false);
  };

  // 🖱️ Desktop drag select
  const handleMouseDown = (dateStr: string, idx: number) => {
    if (mode !== "drag" || warnIfNoRoom()) return;
    setDragState({ date: dateStr, startIdx: idx, endIdx: idx });
  };
  const handleMouseEnter = (dateStr: string, idx: number) => {
    if (mode === "drag" && dragState?.date === dateStr)
      setDragState({ ...dragState, endIdx: idx });
  };
  const handleMouseUp = (dateStr: string) => {
    if (mode === "drag" && dragState?.date === dateStr)
      finalizeSelection(dateStr, dragState.startIdx!, dragState.endIdx!);
  };

  // 📱 Tablet click-click
  const handleSlotClick = (dateStr: string, idx: number) => {
    if (mode !== "click-range" || warnIfNoRoom()) return;
    if (!clickPending) {
      setClickPending({ date: dateStr, idx });
      return;
    }
    if (clickPending.date === dateStr) {
      finalizeSelection(dateStr, clickPending.idx, idx);
      setClickPending(null);
    } else {
      setClickPending({ date: dateStr, idx });
    }
  };

  // 📱 Mobile modal picker
  const openModalFor = (dateStr: string, idx: number) => {
    if (mode !== "modal" || warnIfNoRoom()) return;
    setModalDate(dateStr);
    setModalStartIdx(idx);
    setModalEndIdx(Math.min(idx + 1, timeSlots.length - 1));
    setModalOpen(true);
  };

  const confirmModal = () => {
    if (!modalDate) return;
    finalizeSelection(modalDate, modalStartIdx, modalEndIdx);
  };

  // ⎋ Cancel with ESC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setDragState(null);
        setClickPending(null);
        setModalOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <Card className="mb-6 relative">
      <CardHeader>
        <div className="flex flex-wrap items-center w-full gap-2">
          <div className="flex items-center flex-grow sm:flex-none min-w-[180px] space-x-2">
            <Calendar className="w-5 h-5 text-blue-600 shrink-0" />
            <CardTitle className="text-lg font-medium truncate">Room Usage</CardTitle>
          </div>

          <div className="flex justify-end flex-grow sm:flex-1">
            <Select
              value={selectedRoom}
              onValueChange={(v) => {
                setSelectedRoom(v);
                setGlobalValues?.((p) => ({ ...p, room: v }));
              }}
            >
              <SelectTrigger className="w-full max-w-xs md:max-w-sm lg:max-w-md">
                <SelectValue placeholder="Select room" />
              </SelectTrigger>
              <SelectContent>
                {roomList.map((r, i) => (
                  <SelectItem key={i} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          {selectedRoom || "Select a room"} — Bookings (next 5 weekdays)
        </p>
        <p className="text-xs text-gray-500 italic">
          Mode: {mode === "drag" ? "🖱️ Drag Range" : mode === "click-range" ? "📲 Click-Click" : "🕐 Modal Picker"}
        </p>
      </CardHeader>

      <CardContent className="flex flex-col overflow-hidden h-[576px] relative">
        {/* Overlay when no room selected */}
        {!selectedRoom && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] z-20 flex items-center justify-center text-gray-600 font-medium">
            <AlertCircle className="w-5 h-5 mr-2 text-yellow-600" />
            Please select a room to view or book schedule.
          </div>
        )}

        {/* Gantt grid */}
        <div className="grid" style={{ gridTemplateColumns: `80px repeat(${visibleDates.length}, 1fr)` }}>
          {/* Time column */}
          <div className="flex flex-col overflow-hidden h-[576px]">
            {timeSlots.map((slot, i) => (
              <div
                key={i}
                className={`h-8 text-xs border-b flex items-center justify-end pr-2 ${
                  Math.floor(i / 2) % 2 === 0 ? "bg-muted" : "bg-white"
                } text-muted-foreground`}
              >
                {slot}
              </div>
            ))}
          </div>

          {/* Date columns */}
          {visibleDates.map((dateStr) => (
            <div key={dateStr} className="relative border-l border-gray-200">
              {timeSlots.map((_, idx) => {
                const slotStart = timeSlots[idx];
                const slotEnd = timeSlots[idx + 1] || "17:30";

                const isOccupied = bookings.some(
                  (b) => b.room === selectedRoom && b.date === dateStr && slotStart >= b.start_time && slotStart < b.end_time
                );

                const isSelectedFinal =
                  userSelection.date === dateStr &&
                  slotStart >= (userSelection.start || "") &&
                  slotStart < (userSelection.end || "");

                const inDrag =
                  dragState?.date === dateStr &&
                  idx >= Math.min(dragState.startIdx ?? 0, dragState.endIdx ?? 0) &&
                  idx <= Math.max(dragState.startIdx ?? 0, dragState.endIdx ?? 0);

                const isClickPending =
                  clickPending?.date === dateStr && clickPending.idx === idx;

                return (
                  <div
                    key={idx}
                    onMouseDown={() => handleMouseDown(dateStr, idx)}
                    onMouseEnter={() => handleMouseEnter(dateStr, idx)}
                    onMouseUp={() => handleMouseUp(dateStr)}
                    onClick={() => {
                      if (mode === "click-range") handleSlotClick(dateStr, idx);
                      if (mode === "modal") openModalFor(dateStr, idx);
                    }}
                    className={`h-8 border-b border-dashed cursor-pointer transition-colors
                      ${isOccupied ? "bg-blue-200/80 cursor-not-allowed" : ""}
                      ${inDrag ? "bg-green-300/70" : ""}
                      ${isClickPending ? "bg-yellow-200/70" : ""}
                      ${isSelectedFinal ? "bg-green-400/60" : ""}
                      ${
                        !isOccupied && !inDrag && !isClickPending && !isSelectedFinal
                          ? "hover:bg-blue-100"
                          : ""
                      }`}
                    title={isOccupied ? "Already booked" : `Book ${slotStart}–${slotEnd}`}
                  />
                );
              })}

              {/* Booking blocks */}
              {bookings
                .filter((b) => b.room === selectedRoom && b.date === dateStr)
                .map((b) => {
                  const start = timeToIndex(b.start_time);
                  const end = timeToIndex(b.end_time);
                  const span = Math.max(1, end - start);
                  console.log("b",b)
                  return (
                    <div
                      key={b.id}
                      className="absolute left-1 right-1 rounded-md px-2 py-1 text-xs text-white shadow"
                      style={{
                        top: `${start * 32}px`,
                        height: `${span * 32}px`,
                        backgroundColor: "#3B82F6",
                      }}
                    >
                      <div className="font-semibold">{b.booked_by}</div>
                      <div className="text-[10px]">{b.start_time}–{b.end_time}</div>
                      <div className="text-[10px]">PIC : {b.PIC} </div>
                    </div>
                  );
                })}
            </div>
          ))}
        </div>

        {/* Day labels */}
        <div
          className="grid mt-4 text-sm font-medium text-center"
          style={{ gridTemplateColumns: `80px repeat(${visibleDates.length}, 1fr)` }}
        >
          <div />
          {visibleDates.map((d) => {
            const date = new Date(d);
            const label = date.toLocaleDateString(undefined, {
              weekday: "short",
              month: "short",
              day: "numeric",
            });
            return <div key={d}>{label}</div>;
          })}
        </div>

        {userSelection.start && (
          <div className="mt-3 text-xs text-gray-600 text-center">
            ✅ Selected: <b>{selectedRoom}</b> on <b>{userSelection.date}</b> —{" "}
            {userSelection.start} → {userSelection.end}
          </div>
        )}

        {warning && (
          <div className="absolute bottom-0 left-0 right-0 text-center py-2 text-sm text-red-600 bg-red-50 border-t border-red-200">
            {warning}
          </div>
        )}
      </CardContent>

      {/* --- Modal Picker --- */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setModalOpen(false)} />
          <div className="relative bg-white rounded shadow-lg p-5 w-11/12 max-w-lg z-60">
            <h3 className="font-semibold mb-3 text-center text-gray-700">Select meeting end time</h3>

            <div className="grid grid-cols-2 gap-4 items-center mb-4">
              <div>
                <label className="text-xs text-gray-500">Start</label>
                <input
                  className="w-full border rounded p-2 bg-gray-100 text-gray-700"
                  type="text"
                  value={timeSlots[modalStartIdx]}
                  readOnly
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">End</label>
                <select
                  className="w-full border rounded p-2"
                  value={modalEndIdx}
                  onChange={(e) => setModalEndIdx(Number(e.target.value))}
                >
                  {timeSlots.map((t, i) =>
                    i > modalStartIdx ? (
                      <option key={t} value={i}>
                        {t}
                      </option>
                    ) : null
                  )}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-100"
                onClick={() => setModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
                onClick={confirmModal}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default GanttRoomUsage;

import React, { useState, useEffect, useMemo } from "react";
import { useDispatch } from "react-redux";
import { useAppSelector } from "@/hooks/useAppSelector";
import { useAppDispatch } from "@/hooks/useAppDispatch";
import { fetchMeetingBookings, fetchMeetingRooms } from "@/store/slices/meetingroom_slice";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format, addDays, subDays, startOfDay } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
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
  // We want to show 5 week days starting from the date
  while (days.length < 5) {
    if (date.getDay() !== 0 && date.getDay() !== 6) {
      days.push(date.toISOString().split("T")[0]);
    }
    date.setDate(date.getDate() + 1);
  }
  return days;
}

const GanttRoomUsage: React.FC<WidgetProps> = ({ formData = {}, setGlobalValues }) => {
  const dispatch = useAppDispatch();
  const { bookings, rooms, loading } = useAppSelector((state) => state.meetingroom);

  // 🔍 Debug: Inspect incoming data


  useEffect(() => {
    dispatch(fetchMeetingRooms());
    dispatch(fetchMeetingBookings());
  }, [dispatch]);

  const [selectedRoom, setSelectedRoom] = useState<string>(formData["room"] || formData["room_name"] || "");
  const [userSelection, setUserSelection] = useState<{ date?: string; start?: string; end?: string }>({
    date: formData["date"],
    start: formData["start_time"],
    end: formData["end_time"],
  });
  const [mode, setMode] = useState<"drag" | "click-range" | "modal">("drag");
  const [dragState, setDragState] = useState<{ date?: string; startIdx?: number; endIdx?: number } | null>(null);
  const [clickPending, setClickPending] = useState<{ date: string; idx: number } | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalDate, setModalDate] = useState<string | null>(null);
  const [modalStartIdx, setModalStartIdx] = useState<number>(0);
  const [modalEndIdx, setModalEndIdx] = useState<number>(0);
  const [warning, setWarning] = useState<string | null>(null);

  // 🕒 Date Navigation State
  // 🕒 Date Navigation State: Start from the beginning of the current week (Monday)
  const getStartOfCurrentWeek = () => {
    const today = new Date();
    const day = today.getDay(); // 0 is Sunday
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Adjust when Sunday
    return startOfDay(new Date(today.setDate(diff)));
  };

  const [baseDate, setBaseDate] = useState(getStartOfCurrentWeek());
  const [direction, setDirection] = useState(0); // -1 for left, 1 for right (animation)

  const visibleDates = useMemo(() => getNextFiveWeekdays(baseDate), [baseDate]);

  const handlePrevDay = () => {
    setDirection(-1);
    setBaseDate(prev => {
      let d = subDays(prev, 1);
      // Skip weekends when navigating back
      if (d.getDay() === 0) d = subDays(d, 2); // Sun -> Fri
      if (d.getDay() === 6) d = subDays(d, 1); // Sat -> Fri
      return d;
    });
  };

  const handleNextDay = () => {
    setDirection(1);
    setBaseDate(prev => {
      let d = addDays(prev, 1);
      // Skip weekends when navigating forward
      if (d.getDay() === 0) d = addDays(d, 1); // Sun -> Mon
      if (d.getDay() === 6) d = addDays(d, 2); // Sat -> Mon
      return d;
    });
  };

  const handleToday = () => {
    setDirection(baseDate > new Date() ? -1 : 1);
    setBaseDate(getStartOfCurrentWeek());
  };

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
    const rawVal = formData["room"] || formData["room_name"];
    if (!rawVal) return;

    // Handle both cases: rawVal could be an ID (from form) or Name (from legacy)
    // We map it to our internal Name-based state for visual rendering
    const roomFromId = rooms.find(r => r.resource_key === rawVal || String(r.id) === String(rawVal))?.room_name;
    const rName = roomFromId || rawVal;

    if (rName && rName !== selectedRoom) {
      setSelectedRoom(rName);
    }
  }, [formData["room"], formData["room_name"], rooms]);

  // 🧩 Initial Sync (Push defaults to form if form is empty)
  useEffect(() => {
    const formRoom = formData["room"] || formData["room_name"];
    if (selectedRoom && !formRoom) {
      const roomObj = rooms.find(r => r.room_name === selectedRoom);
      const roomId = roomObj?.resource_key || roomObj?.id;
      if (roomId) {
        setGlobalValues?.((p) => ({
          ...p,
          room: roomId, // Use ID for Form Engine compatibility
          room_id: roomId
        }));
      }
    }
  }, [selectedRoom, rooms]);

  useEffect(() => {
    if (formData["date"] !== userSelection.date ||
      formData["start_time"] !== userSelection.start ||
      formData["end_time"] !== userSelection.end) {
      setUserSelection({
        date: formData["date"],
        start: formData["start_time"],
        end: formData["end_time"]
      });
    }
  }, [formData["date"], formData["start_time"], formData["end_time"]]);

  const roomList = useMemo(() => rooms.map((r) => r.room_name), [rooms]);

  const timeToIndex = (time?: string) => {
    if (!time) return 0;
    const [h, m] = time.split(":").map(Number);
    return (h - 8) * 2 + (m >= 30 ? 1 : 0);
  };

  const warnIfNoRoom = () => {
    if (!selectedRoom) {
      setWarning("⚠️ Please select a room before booking a time slot.");
      setTimeout(() => setWarning(null), 2500);
      return true;
    }
    return false;
  };

  const finalizeSelection = (dateStr: string, startIdx: number, endIdx: number) => {
    const start = timeSlots[Math.min(startIdx, endIdx)];
    const end = timeSlots[Math.max(startIdx, endIdx) + 1] || "17:30";
    const roomObj = rooms.find(r => r.room_name === selectedRoom);
    const roomId = roomObj?.resource_key || roomObj?.id;

    setGlobalValues?.((prev) => ({
      ...prev,
      room: roomId, // Send Canonical ID to Form Engine
      date: dateStr,
      start_time: start,
      end_time: end,
    }));
    setUserSelection({ date: dateStr, start, end });
    setDragState(null);
    setClickPending(null);
    setModalOpen(false);
  };

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

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 100 : -100,
      opacity: 0,
    }),
  };

  console.log("=== Gantt Widget Debug ===");
  console.log("Current Base Date:", baseDate);
  console.log("Total Bookings Fetched:", bookings?.length);
  console.log("Bookings Data:", bookings);
  console.log("Selected Room:", selectedRoom);

  return (
    <Card className="mb-6 relative overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-center w-full gap-2">
          <div className="flex items-center flex-grow sm:flex-none min-w-[180px] space-x-2">
            <Calendar className="w-5 h-5 text-blue-600 shrink-0" />
            <CardTitle className="text-lg font-medium truncate">Meeting Schedule</CardTitle>
          </div>

          <div className="flex justify-end flex-grow sm:flex-1 gap-2 items-center">
            {/* Date Navigation Controls */}
            <div className="flex bg-muted rounded-md p-1 items-center border shadow-sm">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handlePrevDay}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="px-2 h-8 text-xs font-semibold" onClick={handleToday}>
                Today
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleNextDay}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <Select
              value={selectedRoom}
              onValueChange={(v) => {
                setSelectedRoom(v);
                const roomObj = rooms.find(r => r.room_name === v);
                setGlobalValues?.((p) => ({
                  ...p,
                  room: v,
                  room_name: v,
                  room_id: roomObj?.resource_key || roomObj?.id
                }));
              }}
            >
              <SelectTrigger className="w-full max-w-[150px] md:max-w-[200px] h-9">
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
        <div className="flex justify-between items-end mt-2">
          <div>
            <p className="text-xs text-muted-foreground font-medium">
              Viewing: <span className="text-blue-600 font-bold">{format(new Date(visibleDates[0]), 'MMM d')} – {format(new Date(visibleDates[4]), 'MMM d, yyyy')}</span>
            </p>
            <p className="text-[10px] text-gray-500 italic mt-0.5">
              {mode === "drag" ? "🖱️ Drag Range" : mode === "click-range" ? "📲 Click-Click" : "🕐 Modal Picker"}
            </p>
          </div>
          <div className="flex gap-2 text-[10px]">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span>Booked</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span>Selection</span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col relative p-0 border-t">
        {/* Table Header Row (Top Headers) */}
        <div className="grid border-b bg-muted/30" style={{ gridTemplateColumns: `80px repeat(${visibleDates.length}, 1fr)` }}>
          <div className="h-10 flex items-center justify-center text-[10px] font-bold uppercase text-muted-foreground border-r bg-muted/50">
            Time
          </div>
          {visibleDates.map((dStr) => {
            const d = new Date(dStr);
            const isToday = dStr === format(new Date(), 'yyyy-MM-dd');
            return (
              <div
                key={dStr}
                className={`h-10 flex flex-col items-center justify-center border-r last:border-r-0 ${isToday ? "bg-blue-50/50" : ""}`}
              >
                <span className={`text-[10px] uppercase font-bold ${isToday ? "text-blue-600" : "text-muted-foreground"}`}>
                  {format(d, 'eee')}
                </span>
                <span className={`text-xs font-black ${isToday ? "text-blue-700" : "text-foreground"}`}>
                  {format(d, 'MMM d')}
                </span>
              </div>
            );
          })}
        </div>

        <div className="flex overflow-hidden h-[576px] relative">
          {/* Overlay when no room selected */}
          {!selectedRoom && (
            <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] z-20 flex items-center justify-center text-gray-600 font-medium">
              <AlertCircle className="w-5 h-5 mr-2 text-yellow-600" />
              Please select a room to see availability.
            </div>
          )}

          {/* Time column (Left, Fixed) */}
          <div className="flex flex-col w-[80px] bg-white z-10 border-r shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
            {timeSlots.map((slot, i) => (
              <div
                key={i}
                className={`h-8 text-[11px] border-b flex items-center justify-end pr-2 ${Math.floor(i / 2) % 2 === 0 ? "bg-muted/30" : "bg-white"} text-muted-foreground font-medium`}
              >
                {slot}
              </div>
            ))}
          </div>

          {/* Gantt Grid with Animation */}
          <div className="flex-grow relative overflow-hidden">
            <AnimatePresence initial={false} custom={direction} mode="wait">
              <motion.div
                key={visibleDates.join(',')}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: "spring", stiffness: 300, damping: 30 },
                  opacity: { duration: 0.2 },
                }}
                className="absolute inset-0 grid"
                style={{ gridTemplateColumns: `repeat(${visibleDates.length}, 1fr)` }}
              >
                {visibleDates.map((dateStr) => (
                  <div key={dateStr} className="relative border-r last:border-r-0">
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

                      const isToday = dateStr === format(new Date(), 'yyyy-MM-dd');

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
                            ${isOccupied ? "bg-blue-200/40 cursor-not-allowed opacity-50" : ""}
                            ${inDrag ? "bg-green-300/50" : ""}
                            ${isClickPending ? "bg-yellow-200/50" : ""}
                            ${isSelectedFinal ? "bg-green-400/50 border-x-2 border-green-500/30" : ""}
                            ${!isOccupied && !inDrag && !isClickPending && !isSelectedFinal
                              ? isToday ? "bg-blue-50/20 hover:bg-blue-100/50" : "hover:bg-blue-50/50"
                              : ""
                            }`}
                          title={isOccupied ? "Already booked" : `Book ${slotStart}–${slotEnd}`}
                        />
                      );
                    })}

                    {/* Booking blocks rendered strictly inside the day column */}
                    {bookings
                      .filter((b) => b.room === selectedRoom && b.date === dateStr)
                      .map((b) => {
                        const start = timeToIndex(b.start_time);
                        const end = timeToIndex(b.end_time);
                        const span = Math.max(1, end - start);
                        return (
                          <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            key={b.id}
                            className="absolute left-[3px] right-[3px] rounded-md px-2 py-1 text-[10px] text-white shadow-sm overflow-hidden z-[5] hover:z-10 hover:shadow-md transition-all group"
                            style={{
                              top: `${start * 32 + 2}px`,
                              height: `${span * 32 - 4}px`,
                              backgroundColor: "#3B82F6",
                            }}
                            title={`Purpose: ${b.purpose || 'Meeting'}\nPIC: ${b.PIC || 'Unknown'}\nDept: ${b.booked_by || 'Unknown'}\nTime: ${b.start_time} - ${b.end_time}`}
                          >
                            <div className="font-bold truncate">{b.purpose || b.PIC || b.booked_by}</div>
                            <div className="opacity-90">{b.start_time}–{b.end_time}</div>
                            {/* Hover Details (Mini Tooltip within card if space allows, or use standard browser title) */}
                            <div className="hidden group-hover:block absolute top-0 left-0 right-0 bottom-0 bg-blue-600 p-1">
                              <div className="font-bold truncate text-xs">{b.purpose || "Meeting"}</div>
                              <div className="truncate text-[9px] opacity-90">👤 {b.PIC}</div>
                              <div className="truncate text-[9px] opacity-75">🏢 {b.booked_by}</div>
                            </div>
                          </motion.div>
                        );
                      })}
                  </div>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {userSelection.start && (
          <div className="p-2 text-[10px] bg-green-50 border-t border-green-100 text-green-700 flex items-center justify-center gap-2">
            <span className="font-bold">✓ Selected:</span>
            <span>{selectedRoom} on {userSelection.date ? format(new Date(userSelection.date), 'iiii, MMM d') : '---'}</span>
            <span className="bg-green-200 px-2 py-0.5 rounded-full font-black">{userSelection.start} – {userSelection.end}</span>
          </div>
        )}

        {warning && (
          <div className="absolute bottom-10 left-4 right-4 text-center py-2 px-4 rounded-full text-xs font-bold text-red-600 bg-red-100 border border-red-200 shadow-lg animate-bounce z-50">
            {warning}
          </div>
        )}
      </CardContent>

      {/* --- Modal Picker --- */}
      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative bg-white rounded-xl shadow-2xl p-6 w-11/12 max-w-sm z-[110] border"
          >
            <h3 className="font-bold mb-4 text-center text-gray-800 text-lg">Set Meeting Duration</h3>
            <p className="text-xs text-center text-muted-foreground mb-6">You selected {timeSlots[modalStartIdx]} as start time.</p>

            <div className="grid grid-cols-2 gap-4 items-center mb-8">
              <div>
                <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Start</label>
                <div className="w-full border rounded-lg p-3 bg-gray-50 text-gray-700 font-bold text-center">
                  {timeSlots[modalStartIdx]}
                </div>
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-blue-600 block mb-1">End Time</label>
                <select
                  className="w-full border-2 border-blue-500 rounded-lg p-3 bg-white font-bold text-center focus:ring-2 focus:ring-blue-200 outline-none"
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

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                onClick={confirmModal}
              >
                Confirm
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </Card>
  );
};

export default GanttRoomUsage;

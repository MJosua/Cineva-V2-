import React, { useMemo, useState } from "react";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WidgetProps } from "@/types/widgetTypes";
import { useAppSelector } from "@/hooks/useAppSelector";
import { CardCollapsible } from "@/components/ui/CardCollapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { format, addDays, subDays, startOfDay } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

type Booking = {
  id: number;
  room: string;
  startTime: string;
  endTime: string;
  bookedBy: string;
  attendees: number;
  date: string; // Format: YYYY-MM-DD
};

const timeSlots = Array.from({ length: 18 }, (_, i) => {
  const hour = 8 + Math.floor(i / 2);
  const minutes = i % 2 === 0 ? "00" : "30";
  return `${hour.toString().padStart(2, "0")}:${minutes}`;
});

const getNextSevenDays = (startDate = new Date()) => {
  const days: string[] = [];
  const date = new Date(startDate);
  for (let i = 0; i < 7; i++) {
    days.push(date.toISOString().split("T")[0]);
    date.setDate(date.getDate() + 1);
  }
  return days;
}

const GanttRoomUsageStatic: React.FC<WidgetProps> = ({
  widgetData,
  isLoading,
  error,
}) => {
  const { ticketDetail } = useAppSelector((state) => state.tickets);

  // 🔹 Extract current ticket's info FIRST to set initial date
  const findValue = (keys: string[], labelMatch?: string) => {
    return ticketDetail?.detail_rows?.find((r) => {
      const k = r.key?.toLowerCase();
      const lbl = r.lbl_col?.toLowerCase();
      const keyMatch = k && keys.includes(k);
      const labelMatchResult = labelMatch && lbl && lbl.includes(labelMatch.toLowerCase());
      return keyMatch || labelMatchResult;
    })?.cstm_col || "";
  };

  const selectedDate = findValue(["date", "booking_date", "start_date"], "Date");

  // 🕒 Date Navigation State
  const getStartOfWeek = (base = new Date()) => {
    const d = new Date(base);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when Sunday
    return startOfDay(new Date(d.setDate(diff)));
  };

  const [baseDate, setBaseDate] = useState(() => {
    // If ticket has a date, use that week. Otherwise use current week.
    return getStartOfWeek(selectedDate ? new Date(selectedDate) : new Date());
  });

  const [direction, setDirection] = useState(0);

  const visibleDates = useMemo(() => getNextSevenDays(baseDate), [baseDate]);

  const handlePrevDay = () => {
    setDirection(-1);
    setBaseDate(prev => subDays(prev, 1));
  };

  const handleNextDay = () => {
    setDirection(1);
    setBaseDate(prev => addDays(prev, 1));
  };

  const handleToday = () => {
    setDirection(baseDate > new Date() ? -1 : 1);
    setBaseDate(getStartOfWeek());
  };

  // 🔹 Room data from widgetData (for other bookings)
  const roomData: Booking[] = widgetData?.meetingRoomBookings || [];

  const { rooms } = useAppSelector((state) => state.meetingroom);
  const rawRoom = findValue(["room", "room_name", "room_id"], "Room Name");
  // Resolve ID to Name for visual display
  const selectedRoom = rooms.find(r => r.resource_key === rawRoom || String(r.id) === String(rawRoom))?.room_name || rawRoom;

  const startTime = findValue(["start_time", "time_start", "start"], "Start Time");
  const endTime = findValue(["end_time", "time_end", "end"], "End Time");

  const timeToIndex = (time?: string) => {
    if (!time || typeof time !== "string") return 0;
    const [h, m] = time.split(":").map(Number);
    if (isNaN(h) || isNaN(m)) return 0;
    return (h - 8) * 2 + (m >= 30 ? 1 : 0);
  };

  const selectedStart = timeToIndex(startTime);
  const selectedEnd = timeToIndex(endTime);
  const highlightSpan = Math.max(1, selectedEnd - selectedStart);

  const variants = {
    enter: (direction: number) => ({ x: direction > 0 ? 50 : -50, opacity: 0 }),
    center: { zIndex: 1, x: 0, opacity: 1 },
    exit: (direction: number) => ({ zIndex: 0, x: direction < 0 ? 50 : -50, opacity: 0 }),
  };

  if (isLoading) {
    return (
      <CardCollapsible title="Loading Room Schedule..." description="Fetching booking data" defaultOpen>
        <CardContent className="flex flex-col space-y-4">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </CardCollapsible>
    );
  }

  if (error) {
    return (
      <CardCollapsible title="Room Schedule" description="Unable to load booking data" defaultOpen>
        <CardContent>
          <Alert className="border-orange-200 bg-orange-50">
            <AlertDescription className="text-orange-800">{error}</AlertDescription>
          </Alert>
        </CardContent>
      </CardCollapsible>
    );
  }

  return (
    <CardCollapsible
      title={`Room: ${selectedRoom || "Schedule"}`}
      description={selectedDate ? `Booking on ${format(new Date(selectedDate), 'PPPP')}` : "Room Occupancy Overview"}
      defaultOpen
    >
      <CardContent className="flex flex-col p-0 overflow-hidden">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between p-2 bg-muted/30 border-b">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-bold text-blue-800 uppercase tracking-tight">
              {format(new Date(visibleDates[0]), 'MMM d')} – {format(new Date(visibleDates[4]), 'MMM d')}
            </span>
          </div>
          <div className="flex bg-white rounded-md p-0.5 border shadow-sm">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handlePrevDay}>
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="sm" className="px-2 h-7 text-[10px] uppercase font-bold" onClick={handleToday}>
              Today
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleNextDay}>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Top Headers */}
        <div className="grid border-b bg-muted/10" style={{ gridTemplateColumns: `80px repeat(${visibleDates.length}, 1fr)` }}>
          <div className="h-10 flex items-center justify-center text-[10px] font-bold uppercase text-muted-foreground border-r bg-muted/20">
            Time
          </div>
          {visibleDates.map((dStr) => {
            const d = new Date(dStr);
            const isToday = dStr === format(new Date(), 'yyyy-MM-dd');
            const isTarget = dStr === selectedDate;
            const isWeekend = d.getDay() === 0 || d.getDay() === 6;

            let headerBg = "";
            if (isTarget) headerBg = "bg-green-100/80 border-b-2 border-green-500";
            else if (isToday) headerBg = "bg-blue-100/80 border-b-2 border-blue-500";
            else if (isWeekend) headerBg = "bg-slate-200/50";

            return (
              <div
                key={dStr}
                className={`h-10 flex flex-col items-center justify-center border-r last:border-r-0 ${headerBg}`}
              >
                {isWeekend && <span className="text-[8px] font-black text-slate-400 leading-none">WEEKEND</span>}
                <span className={`text-[10px] uppercase font-bold ${isTarget ? "text-green-700" : isToday ? "text-blue-700" : "text-muted-foreground"}`}>
                  {format(d, 'eee')}
                </span>
                <span className={`text-xs font-black ${isTarget ? "text-green-800" : isToday ? "text-blue-800" : "text-foreground"}`}>
                  {format(d, 'MMM d')}
                </span>
              </div>
            );
          })}
        </div>

        <div className="flex overflow-hidden h-[540px] relative">
          {/* Time column */}
          <div className="flex flex-col w-[80px] bg-white z-10 border-r shadow-[1px_0_3px_rgba(0,0,0,0.05)]">
            {timeSlots.map((slot, idx) => (
              <div
                key={idx}
                className={`h-8 text-[10px] border-b flex items-center justify-end pr-2 font-medium text-muted-foreground ${Math.floor(idx / 2) % 2 === 0 ? "bg-muted/30" : "bg-white"}`}
              >
                {slot}
              </div>
            ))}
          </div>

          {/* Date columns with Animation */}
          <div className="flex-grow relative overflow-hidden">
            <AnimatePresence initial={false} custom={direction} mode="wait">
              <motion.div
                key={visibleDates.join(',')}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ x: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.15 } }}
                className="absolute inset-0 grid"
                style={{ gridTemplateColumns: `repeat(${visibleDates.length}, 1fr)` }}
              >
                {visibleDates.map((dateStr) => (
                  <div key={dateStr} className="relative border-r last:border-r-0">
                    {/* Background grid */}
                    {timeSlots.map((_, idx) => {
                      const d = new Date(dateStr);
                      const isToday = dateStr === format(new Date(), 'yyyy-MM-dd');
                      const isWeekend = d.getDay() === 0 || d.getDay() === 6;

                      let bgClass = "bg-white";
                      if (isToday) bgClass = "bg-blue-50/70";
                      else if (isWeekend) bgClass = "bg-slate-100/60";
                      else if (Math.floor(idx / 2) % 2 === 0) bgClass = "bg-muted/10";

                      return (
                        <div
                          key={idx}
                          className={`h-8 border-b border-dashed ${bgClass}`}
                        ></div>
                      );
                    })}

                    {/* Booking blocks */}
                    {roomData
                      .filter((b) => b.room === selectedRoom && b.date === dateStr)
                      .map((b) => {
                        const start = timeToIndex(b.startTime);
                        const end = timeToIndex(b.endTime);
                        const span = Math.max(1, end - start);
                        return (
                          <div
                            key={b.id}
                            className="absolute left-[3px] right-[3px] rounded px-2 py-1 text-[10px] text-white shadow-sm z-[5]"
                            style={{
                              top: `${start * 32 + 2}px`,
                              height: `${span * 32 - 4}px`,
                              backgroundColor: "#3B82F6",
                              opacity: 0.85,
                            }}
                          >
                            <div className="font-bold truncate">{b.bookedBy}</div>
                          </div>
                        );
                      })}

                    {/* 🔹 Highlight current ticket booking */}
                    {dateStr === selectedDate && selectedRoom && (
                      <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="absolute left-[2px] right-[2px] rounded-md px-2 py-1 text-[10px] text-white shadow-md border-2 border-green-600 z-10"
                        style={{
                          top: `${selectedStart * 32 + 1}px`,
                          height: `${highlightSpan * 32 - 2}px`,
                          backgroundColor: "rgba(16, 185, 129, 0.9)",
                        }}
                      >
                        <div className="font-black uppercase text-[9px]">Your Booking</div>
                        <div className="font-bold">{startTime}–{endTime}</div>
                      </motion.div>
                    )}
                  </div>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </CardContent>
    </CardCollapsible>
  );
};

export default GanttRoomUsageStatic;

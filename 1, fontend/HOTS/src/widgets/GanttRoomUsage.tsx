import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useAppSelector } from "@/hooks/useAppSelector";
import { useAppDispatch } from "@/hooks/useAppDispatch";
import { fetchMeetingBookings, fetchMeetingRooms, MeetingBooking } from "@/store/slices/meetingroom_slice";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Calendar,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  X,
  Monitor,
  User,
  Users,
  Eye,
  EyeOff,
  Battery,
  BatteryLow,
  Zap
} from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { API_URL } from "@/config/sourceConfig";
import axios from "axios";


// Generate 30-minute slots (08:00–17:30)
const timeSlots = Array.from({ length: 18 }, (_, i) => {
  const hour = 8 + Math.floor(i / 2);
  const minutes = i % 2 === 0 ? "00" : "30";
  return `${hour.toString().padStart(2, "0")}:${minutes}`;
});

const getNextSevenDays = (startDate = new Date()) => {
  const days: string[] = [];
  const date = new Date(startDate);
  // Return 7 consecutive days including weekends
  for (let i = 0; i < 7; i++) {
    days.push(format(date, 'yyyy-MM-dd'));
    date.setDate(date.getDate() + 1);
  }
  return days;
}

interface GanttRoomUsageProps extends WidgetProps {
  enableBooking?: boolean;
}

const GanttRoomUsage: React.FC<GanttRoomUsageProps> = ({ formData = {}, setGlobalValues, enableBooking = true }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { bookings, rooms, loading } = useAppSelector((state) => state.meetingroom);

  // 🔍 Debug: Inspect incoming data


  useEffect(() => {
    const fetchData = () => {
      dispatch(fetchMeetingRooms());
      dispatch(fetchMeetingBookings());
    };

    fetchData();
    // 🔄 Auto-refresh every 30 seconds for live battery/booking updates
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [dispatch]);

  // 🔋 Battery Reporting — runs only in kiosk mode
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const resourceKey = urlParams.get("resource_key") || localStorage.getItem("current_resource_key");
    const isKiosk = urlParams.get("kiosk_key") === "TABLET_IOD_ASIA" || localStorage.getItem("isKiosk") === "true";

    if (!isKiosk || !resourceKey) {
      console.log("[BATT] Not kiosk mode or no resource_key — skipping battery reporting.");
      return;
    }

    // @ts-ignore
    if (!navigator.getBattery) {
      // Firefox and some other browsers don't support Battery API by default, keep it silent
      return;
    }

    // Store resource_key for session
    localStorage.setItem("current_resource_key", resourceKey);
    console.log(`🔋 [BATT] Kiosk mode active. Reporting battery for: ${resourceKey}`);

    const sendBattery = async (level: number, charging: boolean) => {
      const token = localStorage.getItem("hots_tokek");
      if (!token) {
        console.warn("[BATT] No auth token — skipping report.");
        return;
      }
      try {
        const url = `${API_URL}/api/rooms/battery-status`;
        console.log(`📤 [BATT] Sending → ${resourceKey}: ${level}% (charging=${charging})`);
        await axios.post(url, {
          resource_key: resourceKey,
          battery_level: level,
          is_charging: charging,
        }, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log(`✅ [BATT] Reported ${level}% for ${resourceKey}`);
        localStorage.setItem("last_battery_report", String(Date.now()));
        localStorage.setItem("last_battery_level", String(level));
      } catch (err) {
        console.error("❌ [BATT] Failed to send battery status:", err);
      }
    };

    let lastReportedLevel: number | null = null;

    // @ts-ignore
    navigator.getBattery().then((batt: any) => {
      const getLevel = () => Math.round(batt.level * 100);

      const shouldReport = (level: number) => {
        const lastLevel = Number(localStorage.getItem("last_battery_level") ?? "-1");
        const lastTime = Number(localStorage.getItem("last_battery_report") ?? "0");
        const tenMins = 10 * 60 * 1000;
        const timePassed = Date.now() - lastTime > tenMins;
        const multipleOfFive = level % 5 === 0 && level !== lastLevel;
        return timePassed || multipleOfFive;
      };

      // 📤 Report immediately on load
      const initialLevel = getLevel();
      sendBattery(initialLevel, batt.charging);
      lastReportedLevel = initialLevel;

      // � Low battery alert on load (< 20% and not charging)
      const triggerAlertIfLow = async (level: number, charging: boolean) => {
        if (level < 20 && !charging) {
          const alertKey = `batt_alert_${resourceKey}`;
          if (!sessionStorage.getItem(alertKey)) {
            sessionStorage.setItem(alertKey, '1');
            const token = localStorage.getItem('hots_tokek');
            try {
              console.log(`🚨 [BATT] Battery < 20% — triggering IT alert for ${resourceKey}`);
              await axios.post(`${API_URL}/api/rooms/battery-alert`, {
                resource_key: resourceKey,
                battery_level: level,
                is_charging: charging,
              }, { headers: { Authorization: `Bearer ${token}` } });
              console.log('✅ [BATT] Alert sent to IT team.');
            } catch (err) {
              console.error('❌ [BATT] Alert failed:', err);
              // Reset flag so it can retry next load
              sessionStorage.removeItem(alertKey);
            }
          }
        }
      };

      triggerAlertIfLow(initialLevel, batt.charging);

      // �📡 Listen for changes
      const onLevelChange = () => {
        const level = getLevel();
        if (shouldReport(level)) {
          sendBattery(level, batt.charging);
          lastReportedLevel = level;
        }
      };

      batt.addEventListener("levelchange", onLevelChange);
      batt.addEventListener("chargingchange", () => sendBattery(getLevel(), batt.charging));

      // ⏱ Also send every 10 minutes as a heartbeat
      const heartbeat = setInterval(() => sendBattery(getLevel(), batt.charging), 10 * 60 * 1000);

      return () => {
        clearInterval(heartbeat);
        batt.removeEventListener("levelchange", onLevelChange);
      };
    }).catch((err: any) => {
      console.error("❌ [BATT] Error accessing battery manager:", err);
    });
  }, []); // run once on mount

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

  const [baseDate, setBaseDate] = useState(startOfDay(new Date()));
  const [direction, setDirection] = useState(0); // -1 for left, 1 for right (animation)
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const visibleDates = useMemo(() => {
    const dates = getNextSevenDays(baseDate);
    return isMobile ? dates.slice(0, 3) : dates;
  }, [baseDate, isMobile]);

  const handlePrevDay = () => {
    setDirection(-1);
    setBaseDate(prev => subDays(prev, isMobile ? 3 : 1));
  };

  const handleNextDay = () => {
    setDirection(1);
    setBaseDate(prev => addDays(prev, isMobile ? 3 : 1));
  };

  const handleToday = () => {
    const today = startOfDay(new Date());
    setDirection(baseDate > today ? -1 : 1);
    setBaseDate(today);
  };

  // 👆 Touch Swipe Logic
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;

    // Threshold of 70px for a valid swipe
    if (Math.abs(diff) > 70) {
      if (diff > 0) handleNextDay();
      else handlePrevDay();
    }
    setTouchStart(null);
  };

  // 🔁 Auto mode (responsive interaction)
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setMode("modal");
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
    // 1. If no room selected, auto-select the first one
    if (!selectedRoom && rooms.length > 0) {
      setSelectedRoom(rooms[0].room_name);
      return;
    }

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

  // --- Internal Booking State ---
  const { toast } = useToast();
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [purpose, setPurpose] = useState("");
  const [PIC, setPIC] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [viewBooking, setViewBooking] = useState<MeetingBooking | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const { user, token } = useAppSelector((state) => state.auth); // Extract both user data and auth token

  // --- Edit/Cancel Action State ---
  const [actionType, setActionType] = useState<"edit" | "cancel" | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [newEndTime, setNewEndTime] = useState("");
  const [maxExtensionTime, setMaxExtensionTime] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState(false);

  // Kiosk mode is determined by LocalStorage in this app, as set by MeetingRoomStandalone.tsx
  const isKioskView = localStorage.getItem("isKiosk") === "true";

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
      room: selectedRoom, // Display Name
      room_name: selectedRoom, // Display Name
      room_id: roomId, // Canonical ID
      date: dateStr,
      start_time: start,
      end_time: end,
    }));
    setUserSelection({ date: dateStr, start, end });
    setDragState(null);
    setClickPending(null);
    setModalOpen(false);

    // If internal booking is enabled, open the booking modal (Skip if in Kiosk View as it's handled by Standalone Parent)
    if (enableBooking && !isKioskView) {
      setPurpose("");
      setPIC("");
      setShowBookingModal(true);
    }
  };

  const handleMouseDown = (dateStr: string, idx: number) => {
    if (!enableBooking || mode !== "drag" || warnIfNoRoom()) return;
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
    if (!enableBooking || mode !== "click-range" || warnIfNoRoom()) return;
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
    if (!enableBooking || mode !== "modal" || warnIfNoRoom()) return;
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
            {loading && <div className="animate-pulse flex items-center gap-1 text-[10px] text-blue-500 font-bold ml-2">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
              Refreshing...
            </div>}
          </div>

          <div className="flex justify-end flex-grow sm:flex-1 gap-2 items-center">
            {/* Date Navigation Controls */}
            <div className="flex bg-muted rounded-md p-1 items-center border shadow-sm">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handlePrevDay}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="px-2 h-8 text-xs font-semibold min-w-[60px]" onClick={handleToday} title="Jump to Today">
                {format(baseDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') ? "Today" : format(baseDate, 'MMM d')}
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
                {rooms.map((r, i) => (
                  <SelectItem key={i} value={r.room_name}>
                    {r.room_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-between items-end mt-2">
          <div>
            <p className="text-xs text-muted-foreground font-medium">
              Viewing: <span className="text-blue-600 font-bold">{format(new Date(visibleDates[0]), 'MMM d')} – {format(new Date(visibleDates[visibleDates.length - 1]), 'MMM d, yyyy')}</span>
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
            const isWeekend = d.getDay() === 0 || d.getDay() === 6;

            let headerBg = "";
            if (isToday) headerBg = "bg-blue-100/80 border-b-2 border-blue-500";
            else if (isWeekend) headerBg = "bg-slate-200/50";

            return (
              <div
                key={dStr}
                className={`h-10 flex flex-col items-center justify-center border-r last:border-r-0 ${headerBg}`}
              >
                {isWeekend && <span className="text-[9px] text-gray-500 font-bold tracking-tighter leading-none mb-0.5">WEEKEND</span>}
                <span className={`text-[10px] uppercase font-bold ${isToday ? "text-blue-700" : "text-muted-foreground"}`}>
                  {format(d, 'eee')}
                </span>
                <span className={`text-xs font-black ${isToday ? "text-blue-800" : "text-foreground"}`}>
                  {format(d, 'MMM d')}
                </span>
              </div>
            );
          })}
        </div>

        <div className="flex overflow-x-auto overflow-y-hidden h-[576px] relative">
          {/* Overlay when no room selected */}
          {!selectedRoom && (
            <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] z-20 flex items-center justify-center text-gray-600 font-medium">
              <AlertCircle className="w-5 h-5 mr-2 text-yellow-600" />
              Please select a room to see availability.
            </div>
          )}

          {/* Time column (Left, Fixed) */}
          <div className="flex flex-col w-[80px] bg-white z-10 sticky left-0 border-r shadow-[2px_0_5px_rgba(0,0,0,0.05)] shrink-0">
            {timeSlots.map((slot, i) => (
              <div
                key={i}
                className={`h-8 text-[11px] border-b flex items-start justify-end pr-2 ${Math.floor(i / 2) % 2 === 0 ? "bg-muted/30" : "bg-white"} text-muted-foreground font-semibold`}
              >
                <span className="-mt-1.5">{slot}</span>
              </div>
            ))}
          </div>

          {/* Gantt Grid with Animation */}
          <div
            className="flex-grow relative overflow-hidden"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
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
                className="absolute inset-0 grid w-full min-w-max"
                style={{ gridTemplateColumns: `repeat(${visibleDates.length}, 1fr)` }}
              >
                {visibleDates.map((dateStr) => {
                  const d = new Date(dateStr);
                  const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                  const isToday = dateStr === format(new Date(), 'yyyy-MM-dd');

                  let colBg = "";
                  if (isToday) colBg = "bg-blue-50/70";
                  else if (isWeekend) colBg = "bg-slate-100/60";

                  return (
                    <div key={dateStr} className={`relative border-r last:border-r-0 ${colBg}`}>
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
                        .filter((b) => (b.room || "").toLowerCase() === (selectedRoom || "").toLowerCase() && b.date === dateStr)
                        .map((b) => {
                          const start = timeToIndex(b.start_time);
                          const end = timeToIndex(b.end_time);
                          const span = Math.max(1, end - start);
                          return (
                            <motion.div
                              initial={{ scale: 0.95, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              key={b.id}
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent triggering slot selection
                                setViewBooking(b);
                                setShowViewModal(true);
                              }}
                              className="absolute left-[3px] right-[3px] rounded-md px-2 py-1 text-[10px] text-white shadow-sm overflow-hidden z-[5] hover:z-20 hover:shadow-md transition-all group cursor-pointer"
                              style={{
                                top: `${start * 32 + 2}px`,
                                height: `${span * 32 - 4}px`,
                                backgroundColor: (() => {
                                  const userIdMatch = b.PIC_user_id && String(b.PIC_user_id) === String(user?.user_id);
                                  const normalize = (str?: string) => (str || "").toLowerCase().replace(/[^a-z0-9]/g, "");
                                  const pic = normalize(b.PIC);
                                  const uFirst = normalize(user?.firstname);
                                  const uName = normalize(user?.name);
                                  const bBy = normalize(b.booked_by);

                                  const isOwned = userIdMatch || (pic && (pic === uFirst || pic === uName)) || (bBy && bBy === uFirst);
                                  return isOwned ? "#1E3A8A" : "#60A5FA"; // Dark blue if owned, light blue if not
                                })(),
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
                  );
                })}
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



      {/* --- Internal Booking Modal --- */}
      {
        showBookingModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6"
            >
              <h3 className="text-lg font-semibold mb-4 text-center text-gray-800">
                Confirm Meeting Booking
              </h3>

              <div className="space-y-2 text-sm text-gray-700 mb-4 bg-gray-50 p-3 rounded-md border">
                <p><b className="text-gray-500 w-16 inline-block">Room:</b> {selectedRoom}</p>
                <p><b className="text-gray-500 w-16 inline-block">Date:</b> {userSelection.date ? format(new Date(userSelection.date), 'iiii, MMM d, yyyy') : ''}</p>
                <p><b className="text-gray-500 w-16 inline-block">Time:</b> <span className="text-blue-600 font-bold">{userSelection.start} – {userSelection.end}</span></p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">PIC / Organizer</label>
                  <Input
                    type="text"
                    placeholder="Enter person in charge"
                    value={PIC}
                    onChange={(e) => setPIC(e.target.value)}
                    className="bg-gray-50/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Purpose</label>
                  <Textarea
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    placeholder="Enter meeting purpose or agenda"
                    className="bg-gray-50/50 min-h-[80px]"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowBookingModal(false)}>
                  Cancel
                </Button>
                <Button
                  disabled={submitting || !PIC || !purpose}
                  onClick={async () => {
                    setSubmitting(true);
                    try {
                      const roomObj = rooms.find(r => r.room_name === selectedRoom);
                      const roomId = roomObj?.resource_key || roomObj?.id;

                      // Construct standard HOTS payload
                      const payload = {
                        form_data: {
                          room: { type: "field", label: "Room Name", value: selectedRoom, field_id: "room_field" },
                          room_id: { type: "field", label: "Room ID", value: String(roomId || ""), field_id: "room_id_field" },
                          date: { type: "field", label: "Date", value: userSelection.date, field_id: "date_field" },
                          start_time: { type: "field", label: "Start Time", value: userSelection.start, field_id: "start_time_field" },
                          end_time: { type: "field", label: "End Time", value: userSelection.end, field_id: "end_time_field" },
                          purpose: { type: "field", label: "Purpose of Meeting", value: purpose, field_id: "purpose_field" },
                          PIC: { type: "field", label: "PIC", value: PIC, field_id: "PIC_field" },
                          requested_by: { type: "field", label: "Requested By", value: user?.firstname || "User", field_id: "requested_by_field" }
                        }
                      };

                      await axios.post(`${API_URL}/hots_ticket/create/ticket/13`, payload, {
                        headers: { Authorization: `Bearer ${localStorage.getItem("hots_tokek")}` },
                      });

                      dispatch(fetchMeetingBookings());

                      toast({
                        title: "Success",
                        description: "Meeting room booked successfully!",
                      });

                      setShowBookingModal(false);
                      // Redirect to My Tickets
                      navigate("/my-tickets");
                    } catch (err) {
                      console.error(err);
                      toast({
                        title: "Booking Failed",
                        description: "Could not create booking. Please try again.",
                        variant: "destructive",
                      });
                    } finally {
                      setSubmitting(false);
                    }
                  }}
                  className="bg-blue-600 hover:bg-blue-700 min-w-[100px]"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Booking"}
                </Button>
              </div>
            </motion.div>
          </div>
        )
      }

      {/* --- Modal Picker --- */}
      {
        modalOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center">
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
        )
      }
      {/* --- View Booking Details Modal --- */}
      {showViewModal && viewBooking && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-0 overflow-hidden"
          >
            {/* Modal Header */}
            <div className="bg-blue-600 p-4 text-white">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold leading-tight">
                    {viewBooking.purpose || "Meeting Details"}
                  </h3>
                  <p className="text-[10px] opacity-80 uppercase tracking-wider font-semibold mt-1">
                    Room Schedule Information
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20 h-8 w-8 -mt-2 -mr-2"
                  onClick={() => setShowViewModal(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
                  <Monitor className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase">Room</p>
                  <p className="text-sm font-semibold text-gray-700">{selectedRoom}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase">Date & Time</p>
                  <p className="text-sm font-semibold text-gray-700">
                    {format(new Date(viewBooking.date), 'iiii, MMM d, yyyy')}
                  </p>
                  <p className="text-blue-600 font-bold text-sm">
                    {viewBooking.start_time} – {viewBooking.end_time}
                  </p>
                </div>
              </div>

              {/* Purpose Section */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] text-gray-400 font-bold uppercase">Purpose of Meeting</p>
                  <p className="text-sm font-semibold text-gray-800 leading-snug">
                    {viewBooking.purpose || "No purpose specified"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase">Organizer / PIC</p>
                  <p className="text-sm font-semibold text-gray-700">{viewBooking.PIC || "N/A"}</p>
                </div>
              </div>



              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase">Department / Booked By</p>
                  <p className="text-sm font-semibold text-gray-700">{viewBooking.booked_by || "Anonymous"}</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 flex justify-between items-center rounded-b-xl">
              <div className="flex gap-2">
                {(() => {
                  const userIdMatch = viewBooking.PIC_user_id && String(viewBooking.PIC_user_id) === String(user?.user_id);
                  const normalize = (str?: string) => (str || "").toLowerCase().replace(/[^a-z0-9]/g, "");
                  const pic = normalize(viewBooking.PIC);
                  const uFirst = normalize(user?.firstname);
                  const uName = normalize(user?.name);
                  const bBy = normalize(viewBooking.booked_by);
                  const isOwned = userIdMatch || (pic && (pic === uFirst || pic === uName)) || (bBy && bBy === uFirst);

                  return (isKioskView || isOwned) && (
                    <>
                      <Button
                        variant="destructive"
                        className="font-bold shadow-sm"
                        onClick={() => { setActionType("cancel"); setShowConfirmModal(true); setShowViewModal(false); }}
                      >
                        Cancel Booking
                      </Button>
                      <Button
                        variant="outline"
                        className="font-bold shadow-sm border-blue-600 text-blue-600 hover:bg-blue-50"
                        onClick={async () => {
                          setActionType("edit");
                          setNewEndTime(viewBooking.end_time || "");
                          try {
                            const hots_tokek = localStorage.getItem("hots_tokek");
                            const headers = hots_tokek ? { Authorization: `Bearer ${hots_tokek}` } : {};
                            const res = await axios.get(`${API_URL}/hots_settings/get/meetingroom/boundary`, {
                              params: {
                                date: viewBooking.date,
                                room: viewBooking.room || viewBooking.room_id || selectedRoom,
                                current_time: viewBooking.end_time,
                                ticket_id: viewBooking.id
                              },
                              headers
                            });
                            setMaxExtensionTime(res.data?.data?.max_extension_time || "17:30");
                          } catch (e) {
                            console.error("Failed to fetch boundary", e);
                            setMaxExtensionTime("17:30");
                          }
                          setShowConfirmModal(true);
                          setShowViewModal(false);
                        }}
                      >
                        Edit Time
                      </Button>
                    </>
                  );
                })()}
              </div>
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2 rounded-lg font-bold shadow-sm active:scale-95 transition-all"
                onClick={() => setShowViewModal(false)}
              >
                Close
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* --- Web / Kiosk Confirmation Modal --- */}
      {showConfirmModal && viewBooking && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6"
          >
            <h3 className="text-xl font-bold mb-2 text-gray-800">
              {actionType === "edit" ? "Edit Booking" : "Cancel Booking"}
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              {actionType === "edit" ? "Are you sure you want to edit the time for this booking?" : "Are you sure you want to cancel this booking? This action cannot be undone."}
            </p>

            {isKioskView && (
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">PIC Name</label>
                  <Input
                    type="text"
                    value={viewBooking.PIC || viewBooking.booked_by || "Unknown"}
                    disabled
                    className="bg-gray-100 text-gray-500 cursor-not-allowed font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Password</label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter PIC password"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {actionType === "edit" && (
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">New End Time</label>
                  <Select value={newEndTime} onValueChange={setNewEndTime}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select end time" />
                    </SelectTrigger>
                    <SelectContent className="z-[9999]">
                      {timeSlots
                        .filter(t => t > (viewBooking.start_time || "") && (!maxExtensionTime || t <= maxExtensionTime))
                        .map(t => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  {maxExtensionTime && (
                    <p className="text-[10px] text-gray-400 mt-1 mt-2">
                      Max limit: <span className="font-bold">{maxExtensionTime}</span>
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-3 justify-end mt-4">
              <Button
                variant="outline"
                disabled={loadingAction}
                onClick={() => {
                  setShowConfirmModal(false);
                  setPassword("");
                }}
              >
                Back
              </Button>
              <Button
                variant={actionType === "cancel" ? "destructive" : "default"}
                className={actionType === "edit" ? "bg-blue-600 hover:bg-blue-700" : ""}
                disabled={loadingAction || (isKioskView && !password) || (actionType === "edit" && !newEndTime)}
                onClick={async () => {
                  setLoadingAction(true);
                  try {
                    const payload = {
                      action_type: actionType,
                      ticket_id: viewBooking.id,
                      kiosk_password: isKioskView ? password : "",
                      end_time: actionType === "edit" ? newEndTime : undefined
                    };
                    const hots_tokek = localStorage.getItem("hots_tokek");
                    const headers = hots_tokek ? { Authorization: `Bearer ${hots_tokek}` } : {};
                    const res = await axios.post(`${API_URL}/hots_ticket/meetingroom/action`, payload, { headers });

                    if (res.data?.ok) {
                      toast({
                        title: actionType === "edit" ? "Edit Successful" : "Cancel Successful",
                        description: `Meeting successfully ${actionType === "edit" ? "updated" : "cancelled"}.`,
                      });
                      setShowConfirmModal(false);
                      setPassword("");
                      dispatch(fetchMeetingBookings()); // Refresh the Gantt chart
                    }
                  } catch (e: any) {
                    toast({
                      variant: "destructive",
                      title: "Action Failed",
                      description: e.response?.data?.error || e.message || "An unexpected error occurred.",
                    });
                  } finally {
                    setLoadingAction(false);
                  }
                }}
              >
                {loadingAction ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm"}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </Card >
  );
};

export default GanttRoomUsage;

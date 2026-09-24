import React, { useEffect, useState } from "react";
import { supabase } from "../supabase";
import {
  FaCalendarAlt,
  FaClock,
  FaTimes,
  FaCheck,
  FaUserTie,
  FaExclamationCircle,
} from "react-icons/fa";

const DAYS_OF_WEEK = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function ExploreMentors() {
  const [mentors, setMentors] = useState([]);
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [date, setDate] = useState("");
  const [selectedSlotTime, setSelectedSlotTime] = useState("");
  const [loading, setLoading] = useState(false);

  // Availability & Slots State
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [hasAvailabilityConfigured, setHasAvailabilityConfigured] = useState(true);
  const [customTime, setCustomTime] = useState("");

  useEffect(() => {
    fetchMentors();
  }, []);

  const fetchMentors = async () => {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("role", "mentor");

    if (!error) setMentors(data || []);
  };

  // When selected mentor or date changes, compute available time slots
  useEffect(() => {
    if (selectedMentor && date) {
      calculateSlotsForDate(selectedMentor.email, date);
    } else {
      setAvailableSlots([]);
      setSelectedSlotTime("");
    }
  }, [selectedMentor, date]);

  const calculateSlotsForDate = async (mentorEmail, selectedDateStr) => {
    setSlotsLoading(true);
    setSelectedSlotTime("");

    try {
      // 1. Determine day of the week
      const dateParts = selectedDateStr.split("-");
      const targetDate = new Date(
        parseInt(dateParts[0], 10),
        parseInt(dateParts[1], 10) - 1,
        parseInt(dateParts[2], 10)
      );
      const dayName = DAYS_OF_WEEK[targetDate.getDay()];

      // 2. Fetch mentor's recurring availability for this day
      let mentorWindows = [];
      const { data: dbWindows, error: dbError } = await supabase
        .from("mentor_availability")
        .select("*")
        .eq("mentor_email", mentorEmail)
        .eq("day_of_week", dayName)
        .eq("is_active", true);

      if (!dbError && dbWindows && dbWindows.length > 0) {
        mentorWindows = dbWindows;
      } else {
        // Fallback: check localStorage for local testing cache
        const localKey = `mentor_avail_${mentorEmail}`;
        const localRaw = localStorage.getItem(localKey);
        if (localRaw) {
          const parsed = JSON.parse(localRaw);
          mentorWindows = parsed.filter(
            (s) => s.day_of_week === dayName && s.is_active
          );
        }
      }

      // 3. Fetch existing bookings on this date for this mentor to avoid double-booking
      const { data: bookedSessions } = await supabase
        .from("bookings")
        .select("time, status")
        .eq("mentor_email", mentorEmail)
        .eq("date", selectedDateStr)
        .neq("status", "rejected");

      const bookedTimes = new Set(
        (bookedSessions || []).map((b) => (b.time || "").trim())
      );

      // 4. Generate discrete time slots from windows
      if (mentorWindows.length === 0) {
        setHasAvailabilityConfigured(false);
        setAvailableSlots([]);
      } else {
        setHasAvailabilityConfigured(true);
        const generated = [];

        mentorWindows.forEach((win) => {
          const duration = win.slot_duration || 30;
          const [startH, startM] = win.start_time.split(":").map(Number);
          const [endH, endM] = win.end_time.split(":").map(Number);

          let currentMins = startH * 60 + startM;
          const endMins = endH * 60 + endM;

          while (currentMins + duration <= endMins) {
            const h = Math.floor(currentMins / 60);
            const m = currentMins % 60;
            const nextH = Math.floor((currentMins + duration) / 60);
            const nextM = (currentMins + duration) % 60;

            const pad = (n) => String(n).padStart(2, "0");
            const slotStartStr = `${pad(h)}:${pad(m)}`;
            const slotEndStr = `${pad(nextH)}:${pad(nextM)}`;
            const slotLabel = `${slotStartStr} – ${slotEndStr}`;

            const isBooked = bookedTimes.has(slotStartStr) || bookedTimes.has(slotLabel);

            generated.push({
              time: slotStartStr,
              label: slotLabel,
              isBooked,
            });

            currentMins += duration;
          }
        });

        setAvailableSlots(generated);
      }
    } catch (err) {
      console.error("Error computing slots:", err);
      setHasAvailabilityConfigured(false);
    } finally {
      setSlotsLoading(false);
    }
  };

  const handleConfirm = async () => {
    const user = JSON.parse(localStorage.getItem("user"));
    const finalTime = selectedSlotTime || customTime;

    if (!user) {
      alert("Please log in first to book a session.");
      return;
    }

    if (!selectedMentor || !date || !finalTime) {
      alert("Please select a mentor, date, and time slot.");
      return;
    }

    setLoading(true);

    const payload = {
      mentor_email: selectedMentor.email,
      mentee_email: user.email,
      date: date,
      time: finalTime,
      status: "pending",
      completed: false,
      attended: false,
      meeting_link: `${window.location.origin}/video-call`,
      meeting_note: `1-on-1 session booked via availability calendar`,
    };

    const { error } = await supabase.from("bookings").insert([payload]);

    setLoading(false);

    if (error) {
      alert("Booking failed ❌: " + error.message);
    } else {
      alert("Booking request submitted successfully! ✅ The mentor will review your session.");
      setSelectedMentor(null);
      setDate("");
      setSelectedSlotTime("");
      setCustomTime("");
    }
  };

  // Get minimum selectable date (today in YYYY-MM-DD)
  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* HEADER */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-blue-700">
            Explore & Book Mentors
          </h1>
          <p className="mt-2 text-gray-600 text-lg">
            Connect 1-on-1 with industry leaders. Browse real-time availability slots and book seamlessly.
          </p>
        </div>

        {/* MENTOR CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mentors.map((m) => (
            <div
              key={m.id}
              className="bg-white p-6 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-xl">
                    <FaUserTie />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">{m.name || "Mentor"}</h2>
                    <p className="text-sm text-gray-500">{m.email}</p>
                  </div>
                </div>

                {m.bio && <p className="text-gray-600 text-sm mb-3 line-clamp-2">{m.bio}</p>}

                {m.skills && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {m.skills.split(",").slice(0, 4).map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-md"
                      >
                        {skill.trim()}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={() => {
                  setSelectedMentor(m);
                  setDate("");
                  setSelectedSlotTime("");
                }}
                className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-xl shadow transition flex items-center justify-center gap-2"
              >
                <FaCalendarAlt /> View Availability & Book
              </button>
            </div>
          ))}
        </div>

        {/* BOOKING MODAL */}
        {selectedMentor && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
              {/* Close Button */}
              <button
                onClick={() => setSelectedMentor(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition"
              >
                <FaTimes className="text-lg" />
              </button>

              <div className="mb-5 border-b pb-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                  1-on-1 Session Booking
                </span>
                <h2 className="text-2xl font-bold text-gray-800 mt-1">
                  Book with {selectedMentor.name || selectedMentor.email}
                </h2>
                <p className="text-sm text-gray-500">{selectedMentor.email}</p>
              </div>

              {/* Step 1: Select Date */}
              <div className="mb-5">
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                  <FaCalendarAlt className="text-blue-600 text-xs" /> Step 1: Choose Date
                </label>
                <input
                  type="date"
                  min={todayStr}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-medium text-gray-800"
                />
              </div>

              {/* Step 2: Slot Picker */}
              {date && (
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                    <FaClock className="text-blue-600 text-xs" /> Step 2: Select Open Time Slot
                  </label>

                  {slotsLoading ? (
                    <div className="py-6 text-center text-gray-500 text-sm animate-pulse">
                      Checking mentor's availability calendar...
                    </div>
                  ) : hasAvailabilityConfigured && availableSlots.length > 0 ? (
                    <div>
                      <p className="text-xs text-gray-500 mb-3">
                        Showing confirmed open slots for this day:
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        {availableSlots.map((slot, idx) => (
                          <button
                            key={idx}
                            type="button"
                            disabled={slot.isBooked}
                            onClick={() => setSelectedSlotTime(slot.time)}
                            className={`p-2.5 text-xs font-semibold rounded-xl border transition-all text-center flex flex-col items-center justify-center gap-1 ${
                              slot.isBooked
                                ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed line-through"
                                : selectedSlotTime === slot.time
                                ? "bg-blue-600 text-white border-blue-600 shadow-md scale-105"
                                : "bg-white text-gray-700 border-blue-200 hover:border-blue-500 hover:bg-blue-50"
                            }`}
                          >
                            <span>{slot.label}</span>
                            {slot.isBooked ? (
                              <span className="text-[10px] text-red-500 font-normal">Booked</span>
                            ) : selectedSlotTime === slot.time ? (
                              <span className="text-[10px] text-blue-100 flex items-center gap-0.5">
                                <FaCheck /> Selected
                              </span>
                            ) : (
                              <span className="text-[10px] text-green-600 font-normal">Available</span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-amber-800">
                      <div className="flex items-start gap-2">
                        <FaExclamationCircle className="text-amber-600 mt-0.5 flex-shrink-0" />
                        <div className="text-xs">
                          <p className="font-semibold">No preset availability slots on this day.</p>
                          <p className="mt-1">
                            The mentor hasn't configured recurring slots for this weekday. You can suggest a custom time below:
                          </p>
                        </div>
                      </div>
                      <input
                        type="time"
                        value={customTime}
                        onChange={(e) => setCustomTime(e.target.value)}
                        className="mt-3 w-full p-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-800 outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Confirmation Footer */}
              <div className="pt-4 border-t flex gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedMentor(null)}
                  className="flex-1 py-3 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={loading || !date || (!selectedSlotTime && !customTime)}
                  onClick={handleConfirm}
                  className={`flex-1 py-3 rounded-xl font-semibold text-white shadow-md transition ${
                    loading || !date || (!selectedSlotTime && !customTime)
                      ? "bg-gray-300 cursor-not-allowed"
                      : "bg-green-600 hover:bg-green-700 active:scale-98"
                  }`}
                >
                  {loading ? "Confirming..." : "Confirm Booking"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ExploreMentors;
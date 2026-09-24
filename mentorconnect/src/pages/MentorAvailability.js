import React, { useEffect, useState } from "react";
import MentorNavbar from "../components/MentorNavbar";
import { supabase } from "../supabase";
import {
  FaCalendarAlt,
  FaClock,
  FaTrash,
  FaPlus,
  FaCheckCircle,
  FaInfoCircle,
  FaRegCalendarCheck,
  FaToggleOn,
  FaToggleOff,
} from "react-icons/fa";

const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const DEFAULT_SLOTS = [
  {
    day_of_week: "Tuesday",
    start_time: "18:00",
    end_time: "20:00",
    slot_duration: 30,
    is_active: true,
  },
  {
    day_of_week: "Thursday",
    start_time: "18:00",
    end_time: "20:00",
    slot_duration: 30,
    is_active: true,
  },
];

function MentorAvailability() {
  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;

  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorNotice, setErrorNotice] = useState("");
  const [successNotice, setSuccessNotice] = useState("");

  // Form State
  const [selectedDay, setSelectedDay] = useState("Tuesday");
  const [startTime, setStartTime] = useState("18:00");
  const [endTime, setEndTime] = useState("20:00");
  const [slotDuration, setSlotDuration] = useState(30);

  useEffect(() => {
    if (user?.email) {
      fetchSlots();
    } else {
      setLoading(false);
    }
  }, []);

  const getStorageKey = () => `mentor_avail_${user?.email || "default"}`;

  const fetchSlots = async () => {
    setLoading(true);
    setErrorNotice("");

    try {
      const { data, error } = await supabase
        .from("mentor_availability")
        .select("*")
        .eq("mentor_email", user.email)
        .order("id", { ascending: true });

      if (error) {
        console.warn("Supabase table lookup error (falling back to local):", error);
        // Fallback to localStorage if table not yet created in Supabase
        const local = localStorage.getItem(getStorageKey());
        if (local) {
          setSlots(JSON.parse(local));
        } else {
          // Initialize with helpful defaults
          const initSlots = DEFAULT_SLOTS.map((s, idx) => ({
            ...s,
            id: Date.now() + idx,
            mentor_email: user.email,
          }));
          setSlots(initSlots);
          localStorage.setItem(getStorageKey(), JSON.stringify(initSlots));
        }
        setErrorNotice(
          "Notice: Connecting via local cache. To enable database persistence across devices, run supabase_availability_schema.sql in your Supabase SQL editor."
        );
      } else if (data && data.length > 0) {
        setSlots(data);
        localStorage.setItem(getStorageKey(), JSON.stringify(data));
      } else {
        // No slots yet, check if there's local data or provide default template
        const local = localStorage.getItem(getStorageKey());
        if (local) {
          setSlots(JSON.parse(local));
        } else {
          setSlots([]);
        }
      }
    } catch (err) {
      console.error(err);
      const local = localStorage.getItem(getStorageKey());
      setSlots(local ? JSON.parse(local) : []);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSlot = async (e) => {
    e.preventDefault();
    if (!startTime || !endTime) {
      alert("Please select both start and end times.");
      return;
    }

    if (startTime >= endTime) {
      alert("End time must be after start time.");
      return;
    }

    setSaving(true);
    setErrorNotice("");
    setSuccessNotice("");

    const newSlot = {
      mentor_email: user.email,
      day_of_week: selectedDay,
      start_time: startTime,
      end_time: endTime,
      slot_duration: parseInt(slotDuration, 10),
      is_active: true,
    };

    try {
      const { data, error } = await supabase
        .from("mentor_availability")
        .insert([newSlot])
        .select();

      let createdSlot;
      if (!error && data && data.length > 0) {
        createdSlot = data[0];
      } else {
        createdSlot = { ...newSlot, id: Date.now() };
      }

      const updated = [...slots, createdSlot];
      setSlots(updated);
      localStorage.setItem(getStorageKey(), JSON.stringify(updated));

      setSuccessNotice(`Added weekly availability for ${selectedDay} (${startTime} - ${endTime})`);
      setTimeout(() => setSuccessNotice(""), 4000);
    } catch (err) {
      console.error(err);
      const createdSlot = { ...newSlot, id: Date.now() };
      const updated = [...slots, createdSlot];
      setSlots(updated);
      localStorage.setItem(getStorageKey(), JSON.stringify(updated));
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (slot) => {
    const nextState = !slot.is_active;
    const updated = slots.map((s) => (s.id === slot.id ? { ...s, is_active: nextState } : s));
    setSlots(updated);
    localStorage.setItem(getStorageKey(), JSON.stringify(updated));

    try {
      await supabase
        .from("mentor_availability")
        .update({ is_active: nextState })
        .eq("id", slot.id);
    } catch (err) {
      console.warn("Update error:", err);
    }
  };

  const handleDeleteSlot = async (id) => {
    if (!window.confirm("Remove this availability window?")) return;

    const updated = slots.filter((s) => s.id !== id);
    setSlots(updated);
    localStorage.setItem(getStorageKey(), JSON.stringify(updated));

    try {
      await supabase.from("mentor_availability").delete().eq("id", id);
    } catch (err) {
      console.warn("Delete error:", err);
    }
  };

  // Group slots by day
  const slotsByDay = DAYS_OF_WEEK.reduce((acc, day) => {
    acc[day] = slots.filter((s) => s.day_of_week === day);
    return acc;
  }, {});

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100">
        <MentorNavbar />
        <div className="text-center mt-20 text-xl text-gray-700">Please log in as a mentor first.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-gray-100 via-blue-50 to-indigo-50">
      <MentorNavbar />

      <div className="container mx-auto px-4 py-10 max-w-6xl">
        {/* HEADER */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 text-white rounded-2xl shadow-lg mb-4">
            <FaRegCalendarCheck className="text-3xl" />
          </div>
          <h1 className="text-4xl font-extrabold text-gray-800">
            Mentor Availability Scheduler
          </h1>
          <p className="mt-2 text-lg text-gray-600 max-w-2xl mx-auto">
            Configure your recurring weekly availability windows. Mentees will only be able to book open slots during your active schedule.
          </p>
        </div>

        {/* NOTICES */}
        {errorNotice && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl flex items-start gap-3 shadow-sm">
            <FaInfoCircle className="text-xl flex-shrink-0 mt-0.5 text-amber-600" />
            <div className="text-sm">{errorNotice}</div>
          </div>
        )}

        {successNotice && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-800 rounded-xl flex items-center gap-3 shadow-sm">
            <FaCheckCircle className="text-lg flex-shrink-0 text-green-600" />
            <div className="text-sm font-medium">{successNotice}</div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* CONFIGURE SLOTS FORM */}
          <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FaCalendarAlt className="text-blue-600" /> Add Weekly Window
            </h2>

            <form onSubmit={handleAddSlot} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Day of the Week
                </label>
                <select
                  value={selectedDay}
                  onChange={(e) => setSelectedDay(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white text-gray-800 font-medium"
                >
                  {DAYS_OF_WEEK.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1">
                    <FaClock className="text-gray-400 text-xs" /> Start Time
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-800 font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1">
                    <FaClock className="text-gray-400 text-xs" /> End Time
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-800 font-medium"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Slot Duration
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[30, 45, 60].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setSlotDuration(mins)}
                      className={`py-2 text-sm font-medium rounded-xl border transition ${
                        slotDuration === mins
                          ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                          : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                      }`}
                    >
                      {mins} mins
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-md transition transform active:scale-95 flex items-center justify-center gap-2"
                >
                  <FaPlus /> {saving ? "Saving..." : "Add Availability"}
                </button>
              </div>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-100 text-xs text-gray-500 space-y-1">
              <p>💡 <b>Tip:</b> If you select 18:00 to 20:00 with 30-minute duration, mentees can choose from 18:00, 18:30, 19:00, or 19:30.</p>
              <p>🔒 Once booked, that specific slot automatically disappears from the calendar.</p>
            </div>
          </div>

          {/* ACTIVE SCHEDULE OVERVIEW */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <FaRegCalendarCheck className="text-green-600" /> Active Weekly Schedule
              </h2>
              <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full">
                {slots.filter((s) => s.is_active).length} Active Windows
              </span>
            </div>

            {loading ? (
              <div className="py-12 text-center text-gray-500">Loading schedule...</div>
            ) : slots.length === 0 ? (
              <div className="py-12 text-center text-gray-400">
                <p className="text-lg">No availability configured yet.</p>
                <p className="text-sm mt-1">Use the form on the left to set your available hours.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {DAYS_OF_WEEK.map((day) => {
                  const daySlots = slotsByDay[day] || [];
                  if (daySlots.length === 0) return null;

                  return (
                    <div
                      key={day}
                      className="p-4 rounded-xl border border-gray-100 bg-gray-50 hover:bg-gray-100/70 transition"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-gray-800">{day}</span>
                        <span className="text-xs text-gray-500">
                          {daySlots.length} window{daySlots.length > 1 ? "s" : ""}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {daySlots.map((slot) => (
                          <div
                            key={slot.id}
                            className={`p-3 rounded-lg border flex items-center justify-between ${
                              slot.is_active
                                ? "bg-white border-blue-200 shadow-sm"
                                : "bg-gray-100 border-gray-200 opacity-60"
                            }`}
                          >
                            <div>
                              <div className="font-semibold text-gray-800 flex items-center gap-1.5 text-sm">
                                <FaClock className="text-blue-500 text-xs" />
                                {slot.start_time} – {slot.end_time}
                              </div>
                              <div className="text-xs text-gray-500 mt-0.5">
                                {slot.slot_duration} min sessions
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleToggleActive(slot)}
                                title={slot.is_active ? "Deactivate" : "Activate"}
                                className="text-xl text-gray-500 hover:text-blue-600 transition"
                              >
                                {slot.is_active ? (
                                  <FaToggleOn className="text-green-600" />
                                ) : (
                                  <FaToggleOff className="text-gray-400" />
                                )}
                              </button>
                              <button
                                onClick={() => handleDeleteSlot(slot.id)}
                                title="Delete window"
                                className="text-gray-400 hover:text-red-500 transition p-1"
                              >
                                <FaTrash className="text-sm" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MentorAvailability;

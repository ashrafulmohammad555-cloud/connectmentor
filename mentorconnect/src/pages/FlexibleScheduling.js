import React, { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { generateGoogleCalendarUrl, downloadIcsFile } from "../utils/calendarSync";
import { FaGoogle, FaDownload } from "react-icons/fa";

function FlexibleScheduling() {
  const [sessions, setSessions] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  const user = JSON.parse(localStorage.getItem("user"));

  // 🔥 Update clock every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // 🔥 Fetch + realtime
  useEffect(() => {
    fetchSessions();

    const channel = supabase
      .channel("bookings-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookings" },
        () => fetchSessions()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchSessions = async () => {
    if (!user) return;

    const { data } = await supabase
      .from("bookings")
      .select("*")
      .eq("mentee_email", user.email)
      .eq("status", "accepted")
      .order("id", { ascending: false });

    setSessions(data || []);
  };

  // 🔥 Convert date+time → Date object
  const getSessionDateTime = (date, time) => {
    return new Date(`${date}T${time}`);
  };

  // 🔥 Time difference
  const getTimeLeft = (sessionTime) => {
    const diff = sessionTime - currentTime;

    if (diff <= 0) return "Live Now";

    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);

    return `${minutes}m ${seconds}s`;
  };

  return (
    <div className="min-h-screen bg-gray-100">

      {/* HEADER */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-14 text-center">
        <h1 className="text-4xl font-bold">
          Scheduled Sessions
        </h1>
        <p className="mt-2 text-lg">
          Real-time confirmed sessions
        </p>
      </div>

      {/* CONTENT */}
      <div className="max-w-5xl mx-auto px-4 py-10">

        {sessions.length === 0 ? (
          <p className="text-center text-gray-500">
            No confirmed sessions
          </p>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">

            {sessions.map((s) => {
              const sessionTime = getSessionDateTime(s.date, s.time);
              const isLive = currentTime >= sessionTime;
              const timeLeft = getTimeLeft(sessionTime);

              return (
                <div
                  key={s.id}
                  className="bg-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition"
                >
                  {/* Mentor */}
                  <h2 className="text-xl font-semibold mb-2">
                    {s.mentor_email}
                  </h2>

                  {/* Date/Time */}
                  <p>📅 {s.date}</p>
                  <p>⏰ {s.time}</p>

                  {/* Countdown */}
                  <p className="mt-2 text-sm text-gray-600">
                    {isLive ? (
                      <span className="text-green-600 font-semibold">
                        🔴 Live Now
                      </span>
                    ) : (
                      <>Starts in: {timeLeft}</>
                    )}
                  </p>

                  {/* Join Button */}
                  <button
                    disabled={!isLive}
                    onClick={() => window.location.href = "/video-call"}
                    className={`mt-4 w-full py-2 rounded font-semibold transition ${
                      isLive
                        ? "bg-green-600 text-white hover:bg-green-700 shadow-md"
                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    {isLive ? "Join Session Now" : "Session Scheduled"}
                  </button>

                  {/* Calendar Sync */}
                  <div className="mt-2.5 pt-2.5 border-t border-gray-100 flex gap-2">
                    <a
                      href={generateGoogleCalendarUrl(s, s.mentor_email)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-1 px-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded flex items-center justify-center gap-1 transition text-center"
                    >
                      <FaGoogle className="text-red-500 text-xs" /> Google Cal
                    </a>
                    <button
                      type="button"
                      onClick={() => downloadIcsFile(s, s.mentor_email)}
                      className="flex-1 py-1 px-2 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-semibold rounded flex items-center justify-center gap-1 transition"
                    >
                      <FaDownload className="text-gray-500 text-xs" /> .ICS Invite
                    </button>
                  </div>
                </div>
              );
            })}

          </div>
        )}

      </div>
    </div>
  );
}

export default FlexibleScheduling;
import React, { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { generateGoogleCalendarUrl, downloadIcsFile } from "../utils/calendarSync";
import { FaGoogle, FaDownload } from "react-icons/fa";

function MyBookings() {
  const [bookings, setBookings] = useState([]);
  // Map of booking_id → feedback record (already submitted)
  const [feedbackMap, setFeedbackMap] = useState({});
  // Per-card form state: { [bookingId]: { rating, comments, suggestions } }
  const [formState, setFormState] = useState({});
  const [submitting, setSubmitting] = useState({});

  const user = JSON.parse(localStorage.getItem("user"));

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchBookings();
    fetchMyFeedback();

    const interval = setInterval(() => {
      fetchBookings();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchBookings = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("mentee_email", user.email)
      .order("id", { ascending: false });

    if (error) {
      console.log(error);
    } else {
      setBookings(data || []);
    }
  };

  // 🔥 FETCH ALREADY-SUBMITTED FEEDBACK FOR THIS MENTEE
  const fetchMyFeedback = async () => {
    if (!user?.email) return;

    const { data, error } = await supabase
      .from("session_feedback")
      .select("*")
      .eq("mentee_email", user.email);

    if (!error && data) {
      const map = {};
      data.forEach((fb) => {
        map[fb.booking_id] = fb;
      });
      setFeedbackMap(map);
    }
  };

  // 🔥 MARK ATTENDANCE
  const markAttendance = async (id) => {
    const { error } = await supabase
      .from("bookings")
      .update({ attended: true })
      .eq("id", id);

    if (error) {
      alert("Failed to mark attendance ❌");
    } else {
      alert("Attendance marked ✅");
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, attended: true } : b))
      );
    }
  };

  // 🔥 UPDATE FORM STATE FOR A SPECIFIC BOOKING
  const updateForm = (bookingId, field, value) => {
    setFormState((prev) => ({
      ...prev,
      [bookingId]: {
        ...(prev[bookingId] || { rating: 0, comments: "", suggestions: "" }),
        [field]: value,
      },
    }));
  };

  // 🔥 SUBMIT FEEDBACK
  const submitFeedback = async (booking) => {
    const form = formState[booking.id] || {};

    if (!form.rating || form.rating < 1) {
      alert("Please select a star rating before submitting.");
      return;
    }

    setSubmitting((prev) => ({ ...prev, [booking.id]: true }));

    const { data, error } = await supabase
      .from("session_feedback")
      .insert([
        {
          booking_id: booking.id,
          mentee_email: user.email,
          mentor_email: booking.mentor_email,
          rating: form.rating,
          comments: form.comments || "",
          suggestions: form.suggestions || "",
          // feedback_date defaults to now() in Supabase
        },
      ])
      .select()
      .single();

    setSubmitting((prev) => ({ ...prev, [booking.id]: false }));

    if (error) {
      console.log("Feedback error:", error);
      alert("Failed to submit feedback ❌");
    } else {
      // Immediately reflect in UI
      setFeedbackMap((prev) => ({ ...prev, [booking.id]: data }));
      setFormState((prev) => {
        const updated = { ...prev };
        delete updated[booking.id];
        return updated;
      });
    }
  };

  // 🌟 RENDER STAR RATING (interactive)
  const StarRating = ({ bookingId, currentRating }) => {
    return (
      <div className="flex gap-1 mt-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => updateForm(bookingId, "rating", star)}
            className={`text-2xl transition-transform hover:scale-110 focus:outline-none ${
              star <= currentRating ? "text-yellow-400" : "text-gray-300"
            }`}
            aria-label={`${star} star`}
          >
            ★
          </button>
        ))}
      </div>
    );
  };

  // 🌟 RENDER STATIC STARS (for submitted feedback display)
  const StaticStars = ({ rating }) => (
    <span className="text-yellow-400 text-lg">
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s}>{s <= rating ? "★" : "☆"}</span>
      ))}
    </span>
  );

  // 📅 FORMAT DATE
  const formatDate = (iso) => {
    if (!iso) return "";
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gray-100">

      {/* HEADER */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-14 text-center">
        <h1 className="text-4xl font-bold">My Bookings</h1>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10">

        {bookings.length === 0 ? (
          <p className="text-center text-gray-500">No bookings</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">

            {bookings.map((b) => {
              const alreadySubmitted = !!feedbackMap[b.id];
              const submittedFeedback = feedbackMap[b.id];
              const form = formState[b.id] || { rating: 0, comments: "", suggestions: "" };
              const isSubmitting = submitting[b.id] || false;

              return (
                <div
                  key={b.id}
                  className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition"
                >

                  {/* MENTOR */}
                  <h2 className="font-semibold mb-2">{b.mentor_email}</h2>

                  {/* DATE TIME */}
                  <p>📅 {b.date || "Not set"}</p>
                  <p>⏰ {b.time || "Not set"}</p>

                  {/* STATUS */}
                  <p className="mt-2">
                    Status:{" "}
                    <span
                      className={
                        b.status === "accepted"
                          ? "text-green-600"
                          : b.status === "rejected"
                          ? "text-red-600"
                          : "text-yellow-600"
                      }
                    >
                      {b.status || "pending"}
                    </span>
                  </p>

                  {/* MEETING INFO */}
                  {b.status === "accepted" && (
                    <div className="mt-3 p-3 bg-green-50 rounded-xl border border-green-200">
                      <p className="text-green-700 font-semibold text-sm">
                        Meeting Confirmed
                      </p>
                      <p className="text-xs text-gray-700 mt-1">📅 {b.date}</p>
                      <p className="text-xs text-gray-700">⏰ {b.time}</p>

                      {/* Calendar Sync Actions */}
                      <div className="mt-3 pt-2 border-t border-green-200/60 flex flex-col sm:flex-row gap-2">
                        <a
                          href={generateGoogleCalendarUrl(b, b.mentor_email)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 py-1.5 px-2 bg-white border border-blue-300 text-blue-700 hover:bg-blue-50 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition shadow-xs text-center"
                        >
                          <FaGoogle className="text-red-500 text-xs" /> Google Cal
                        </a>
                        <button
                          type="button"
                          onClick={() => downloadIcsFile(b, b.mentor_email)}
                          className="flex-1 py-1.5 px-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition shadow-xs"
                        >
                          <FaDownload className="text-gray-500 text-xs" /> .ICS Invite
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ATTENDANCE STATUS */}
                  <p className="mt-3">
                    Attendance:{" "}
                    <span
                      className={
                        b.attended
                          ? "text-green-600 font-semibold"
                          : "text-red-600 font-semibold"
                      }
                    >
                      {b.attended ? "Completed" : "Pending"}
                    </span>
                  </p>

                  {/* ATTEND BUTTON */}
                  <button
                    onClick={() => markAttendance(b.id)}
                    disabled={b.status !== "accepted" || b.attended}
                    className={`mt-4 w-full py-2 rounded text-white ${
                      b.attended
                        ? "bg-green-600"
                        : b.status !== "accepted"
                        ? "bg-gray-400"
                        : "bg-blue-600 hover:bg-blue-700"
                    }`}
                  >
                    {b.attended ? "Attended ✅" : "Mark as Attended"}
                  </button>

                  {/* ⭐ POST-SESSION FEEDBACK SECTION */}
                  {b.attended && (
                    <div className="mt-5 border-t pt-4">

                      {alreadySubmitted ? (
                        /* ✅ FEEDBACK ALREADY SUBMITTED — show summary */
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-green-600 font-semibold text-sm">
                              ✅ Feedback Submitted
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mb-1">
                            <StaticStars rating={submittedFeedback.rating} />
                            <span className="text-gray-500 text-sm">
                              ({submittedFeedback.rating}/5)
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            📅 {formatDate(submittedFeedback.feedback_date)}
                          </p>
                        </div>
                      ) : (
                        /* 📝 FEEDBACK FORM — inline inside card */
                        <div>
                          <p className="text-blue-700 font-bold text-sm mb-3 tracking-wide">
                            💬 How was your session?
                          </p>

                          {/* STAR RATING */}
                          <label className="text-xs text-gray-500 font-medium">
                            Rating
                          </label>
                          <StarRating
                            bookingId={b.id}
                            currentRating={form.rating}
                          />

                          {/* COMMENTS */}
                          <div className="mt-3">
                            <label className="text-xs text-gray-500 font-medium block mb-1">
                              Comments
                            </label>
                            <textarea
                              value={form.comments}
                              onChange={(e) =>
                                updateForm(b.id, "comments", e.target.value)
                              }
                              placeholder="Share your experience..."
                              rows={3}
                              className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                            />
                          </div>

                          {/* SUGGESTIONS */}
                          <div className="mt-2">
                            <label className="text-xs text-gray-500 font-medium block mb-1">
                              Suggestions{" "}
                              <span className="text-gray-400">(optional)</span>
                            </label>
                            <textarea
                              value={form.suggestions}
                              onChange={(e) =>
                                updateForm(b.id, "suggestions", e.target.value)
                              }
                              placeholder="Any suggestions for your mentor..."
                              rows={2}
                              className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                            />
                          </div>

                          {/* SUBMIT BUTTON */}
                          <button
                            onClick={() => submitFeedback(b)}
                            disabled={isSubmitting}
                            className="mt-3 w-full py-2 rounded-lg text-white font-semibold bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 transition text-sm"
                          >
                            {isSubmitting ? "Submitting..." : "Submit Feedback"}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                </div>
              );
            })}

          </div>
        )}

      </div>
    </div>
  );
}

export default MyBookings;
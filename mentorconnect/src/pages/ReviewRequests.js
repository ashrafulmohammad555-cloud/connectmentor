import React, { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { generateGoogleCalendarUrl, downloadIcsFile } from "../utils/calendarSync";
import { FaGoogle, FaDownload, FaCheckCircle } from "react-icons/fa";

function ReviewRequests() {
  const [bookings, setBookings] = useState([]);

  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    const fetchBookings = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("mentor_email", user.email);

      if (error) console.log(error);
      else setBookings(data || []);
    };

    fetchBookings();
  }, [user]);

  // ✅ Accept / Reject
  const updateStatus = async (id, status) => {
    const { error } = await supabase
      .from("bookings")
      .update({ status })
      .eq("id", id);

    if (error) {
      alert("Update failed");
    } else {
      setBookings((prev) =>
        prev.map((b) =>
          b.id === id ? { ...b, status } : b
        )
      );
    }
  };

  // 🔴 Delete
  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Delete this request?");
    if (!confirmDelete) return;

    const { error } = await supabase
      .from("bookings")
      .delete()
      .eq("id", id);

    if (error) {
      alert("Delete failed");
    } else {
      setBookings((prev) =>
        prev.filter((b) => b.id !== id)
      );
    }
  };

  return (
    <div className="min-h-screen p-6 bg-gray-100">

      <h1 className="text-3xl font-bold text-center mb-8">
        Booking Requests
      </h1>

      {bookings.length === 0 ? (
        <p className="text-center text-gray-600">
          No requests yet
        </p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">

          {bookings.map((b) => (
            <div
              key={b.id}
              className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition"
            >

              {/* Mentee */}
              <h2 className="text-lg font-semibold text-gray-800 mb-2">
                {b.mentee_email}
              </h2>

              {/* Info */}
              <p className="text-gray-600">📅 {b.date}</p>
              <p className="text-gray-600 mb-3">⏰ {b.time}</p>

              {/* Status */}
              <p className="mb-4">
                Status:{" "}
                <span
                  className={`font-semibold ${
                    b.status === "accepted"
                      ? "text-green-600"
                      : b.status === "rejected"
                      ? "text-red-600"
                      : "text-yellow-600"
                  }`}
                >
                  {b.status || "pending"}
                </span>
              </p>

              {/* BUTTONS */}
              <div className="flex gap-3">

                {/* ACCEPT */}
                <button
                  onClick={() => updateStatus(b.id, "accepted")}
                  disabled={b.status === "accepted" || b.status === "rejected"}
                  className={`flex-1 py-2 rounded text-white font-medium ${
                    b.status === "accepted"
                      ? "bg-green-600"
                      : b.status === "rejected"
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-green-600 hover:bg-green-700"
                  }`}
                >
                  Accept
                </button>

                {/* REJECT */}
                <button
                  onClick={() => updateStatus(b.id, "rejected")}
                  disabled={b.status === "accepted" || b.status === "rejected"}
                  className={`flex-1 py-2 rounded text-white font-medium ${
                    b.status === "rejected"
                      ? "bg-red-600"
                      : b.status === "accepted"
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  Reject
                </button>

              </div>

              {/* CALENDAR SYNC FOR ACCEPTED REQUESTS */}
              {b.status === "accepted" && (
                <div className="mt-3 p-3 bg-green-50 rounded-xl border border-green-200">
                  <p className="text-xs font-semibold text-green-700 flex items-center gap-1.5">
                    <FaCheckCircle /> Confirmed Meeting
                  </p>
                  <div className="mt-2 flex gap-2">
                    <a
                      href={generateGoogleCalendarUrl(b, b.mentee_email)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-1.5 px-2 bg-white border border-blue-300 text-blue-700 hover:bg-blue-50 text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition shadow-xs text-center"
                    >
                      <FaGoogle className="text-red-500 text-xs" /> Google Cal
                    </a>
                    <button
                      type="button"
                      onClick={() => downloadIcsFile(b, b.mentee_email)}
                      className="flex-1 py-1.5 px-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition shadow-xs"
                    >
                      <FaDownload className="text-gray-500 text-xs" /> .ICS
                    </button>
                  </div>
                </div>
              )}

              {/* DELETE */}
              <button
                onClick={() => handleDelete(b.id)}
                className="mt-4 w-full py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Delete Request
              </button>

            </div>
          ))}

        </div>
      )}
    </div>
  );
}

export default ReviewRequests;
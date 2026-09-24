import React, { useEffect, useState } from "react";
import MentorNavbar from "../components/MentorNavbar";
import { Link } from "react-router-dom";
import {
  FaUsers,
  FaCalendarCheck,
  FaBookOpen,
  FaClipboardCheck,
  FaChartLine,
  FaVideo,
  FaStar,
  FaRegStar,
  FaClock,
} from "react-icons/fa";
import { supabase } from "../supabase";

function MentorDashboard() {
  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;

  const [feedbacks, setFeedbacks] = useState([]);
  const [loadingFeedback, setLoadingFeedback] = useState(true);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (user?.email) {
      fetchFeedback();
    }
  }, []);

  // 🔥 FETCH FEEDBACK RECEIVED BY THIS MENTOR
  const fetchFeedback = async () => {
    setLoadingFeedback(true);

    const { data, error } = await supabase
      .from("session_feedback")
      .select("*")
      .eq("mentor_email", user.email)
      .order("feedback_date", { ascending: false });

    if (!error && data) {
      setFeedbacks(data);
    }

    setLoadingFeedback(false);
  };

  // 🌟 STATIC STAR DISPLAY
  const StaticStars = ({ rating }) => (
    <span className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) =>
        s <= rating ? (
          <FaStar key={s} className="text-yellow-400 text-base" />
        ) : (
          <FaRegStar key={s} className="text-gray-300 text-base" />
        )
      )}
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

  if (!user) {
    return (
      <div className="text-center mt-20 text-xl">Please login first</div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-gray-100 to-blue-50">
      <MentorNavbar />

      <div className="container mx-auto px-4 py-10">
        <h1 className="text-4xl font-extrabold text-center text-blue-700 mb-10">
          Mentor Dashboard
        </h1>

        {/* ✅ DASHBOARD CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

          <Link
            to="/manage-mentees"
            className="bg-white p-8 rounded-xl shadow hover:shadow-2xl transition text-center"
          >
            <FaUsers className="text-6xl text-blue-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold">Manage Mentees</h2>
          </Link>

          <Link
            to="/schedule-meetings"
            className="bg-white p-8 rounded-xl shadow hover:shadow-2xl transition text-center"
          >
            <FaCalendarCheck className="text-6xl text-purple-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold">Schedule Meetings</h2>
          </Link>

          <Link
            to="/resources-materials"
            className="bg-white p-8 rounded-xl shadow hover:shadow-2xl transition text-center"
          >
            <FaBookOpen className="text-6xl text-green-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold">Resources</h2>
          </Link>

          <Link
            to="/review-requests"
            className="bg-white p-8 rounded-xl shadow hover:shadow-2xl transition text-center"
          >
            <FaClipboardCheck className="text-6xl text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold">Review Requests</h2>
          </Link>

          <Link
            to="/performance-dashboard"
            className="bg-white p-8 rounded-xl shadow hover:shadow-2xl transition text-center"
          >
            <FaChartLine className="text-6xl text-indigo-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold">Performance</h2>
          </Link>

          <Link
            to="/mentor-availability"
            className="bg-white p-8 rounded-xl shadow hover:shadow-2xl transition text-center border border-blue-100 group"
          >
            <FaClock className="text-6xl text-amber-500 mx-auto mb-4 group-hover:scale-110 transition-transform" />
            <h2 className="text-xl font-semibold text-gray-800">Availability Slots</h2>
            <p className="text-xs text-gray-500 mt-1">Configure weekly schedule</p>
          </Link>

          <Link
            to="/video-call"
            className="bg-white p-8 rounded-xl shadow hover:shadow-2xl transition text-center"
          >
            <FaVideo className="text-6xl text-pink-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold">Video Call</h2>
          </Link>

        </div>

        {/* ⭐ FEEDBACK RECEIVED SECTION */}
        <div className="mt-14">
          <h2 className="text-2xl font-bold text-blue-700 mb-6 flex items-center gap-2">
            <FaStar className="text-yellow-400" />
            Feedback Received
          </h2>

          {loadingFeedback ? (
            <p className="text-gray-500 text-center">Loading feedback...</p>
          ) : feedbacks.length === 0 ? (
            <div className="bg-white rounded-xl shadow p-8 text-center text-gray-500">
              <FaStar className="text-gray-300 text-5xl mx-auto mb-3" />
              <p className="text-lg">No feedback received yet.</p>
              <p className="text-sm mt-1">
                Feedback will appear here after mentees complete their sessions.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {feedbacks.map((fb) => (
                <div
                  key={fb.id}
                  className="bg-white rounded-xl shadow hover:shadow-lg transition p-5 border-t-4 border-yellow-400"
                >
                  {/* MENTEE */}
                  <p className="text-sm text-gray-500 mb-1 truncate">
                    👤 <span className="font-medium text-gray-700">{fb.mentee_email}</span>
                  </p>

                  {/* RATING */}
                  <div className="flex items-center gap-2 mt-2 mb-3">
                    <StaticStars rating={fb.rating} />
                    <span className="text-sm text-gray-500">({fb.rating}/5)</span>
                  </div>

                  {/* COMMENTS */}
                  {fb.comments && (
                    <div className="mb-2">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">
                        💬 Comments
                      </p>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {fb.comments}
                      </p>
                    </div>
                  )}

                  {/* SUGGESTIONS */}
                  {fb.suggestions && (
                    <div className="mb-2">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">
                        💡 Suggestions
                      </p>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {fb.suggestions}
                      </p>
                    </div>
                  )}

                  {/* FEEDBACK DATE */}
                  <p className="text-xs text-gray-400 mt-3 border-t pt-2">
                    📅 {formatDate(fb.feedback_date)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default MentorDashboard;
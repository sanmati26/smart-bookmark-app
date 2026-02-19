"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

interface Bookmark {
  id: string;
  user_id: string;
  title: string;
  url: string;
  created_at: string;
}

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Auto-dismiss notification after 3 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Fetch session & auth listener
  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      if (session?.user) fetchBookmarks(session.user.id);
    };
    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchBookmarks(session.user.id);
      else setBookmarks([]);
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  // Fetch bookmarks
  const fetchBookmarks = async (userId: string) => {
    const { data, error } = await supabase
      .from("bookmarks")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (!error) setBookmarks(data ?? []);
  };

  // Realtime subscription
useEffect(() => {
  if (!user) return;

  const channel = supabase
    .channel(`bookmarks_user_${user.id}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "bookmarks",
        filter: `user_id=eq.${user.id}`,
      },
      (payload) => {
        if (payload.eventType === "INSERT") {
          setBookmarks((prev) => [payload.new as Bookmark, ...prev]);
        }
        if (payload.eventType === "DELETE") {
          setBookmarks((prev) =>
            prev.filter((b) => b.id !== (payload.old as Bookmark).id)
          );
        }
      }
    )
    .subscribe();

  // Correct cleanup
  return () => {
    supabase.removeChannel(channel);
  };
}, [user]);



  // Login / Logout
  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({ provider: "google" });
  };
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // Add bookmark
  const addBookmark = async () => {
    if (!title || !url || !user) {
      setNotification({ type: "error", msg: "Please enter both title and URL" });
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("bookmarks")
      .insert([{ title, url, user_id: user.id }])
      .select();
    setLoading(false);

    if (error) setNotification({ type: "error", msg: error.message });
    else if (data) {
      setBookmarks((prev) => [data[0], ...prev]);
      setTitle("");
      setUrl("");
      setNotification({ type: "success", msg: "Bookmark added successfully!" });
    }
  };

  // Delete bookmark
  const deleteBookmark = async (id: string) => {
    const { error } = await supabase.from("bookmarks").delete().eq("id", id);
    if (error) setNotification({ type: "error", msg: error.message });
    else setNotification({ type: "success", msg: "Bookmark deleted!" });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4 sm:p-8">
      {user ? (
        <div className="w-full max-w-2xl relative">
          {/* Notification card */}
          {notification && (
            <div
              className={`absolute top-0 left-1/2 -translate-x-1/2 mt-4 p-4 rounded-lg shadow-lg w-full max-w-md text-center transition-all ${
                notification.type === "success"
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {notification.msg}
            </div>
          )}

          {/* Header */}
          <div className="flex justify-between items-center mb-6 p-4 bg-white rounded-lg shadow">
            <p className="text-lg font-semibold text-gray-900">Welcome, {user.email}</p>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition"
            >
              Logout
            </button>
          </div>

          {/* Add Bookmark Card */}
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Add New Bookmark</h2>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="Bookmark Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="flex-1 border p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-black"
              />
              <input
                type="text"
                placeholder="Bookmark URL"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="flex-1 border p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-black"
              />
              <button
                onClick={addBookmark}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition"
              >
                {loading ? "Adding..." : "Add"}
              </button>
            </div>
          </div>

          {/* Bookmarks List */}
          {bookmarks.length === 0 ? (
            <p className="text-gray-500 mt-4 text-center">No bookmarks yet</p>
          ) : (
            <ul className="grid gap-3">
              {bookmarks.map((b) => (
                <li
                  key={b.id}
                  className="bg-white rounded-lg shadow p-4 flex justify-between items-center hover:shadow-md transition"
                >
                  <div className="flex flex-col">
                    <a
                      href={b.url}
                      target="_blank"
                      className="text-blue-700 font-medium underline truncate"
                    >
                      {b.title}
                    </a>
                    <span className="text-gray-500 text-sm mt-1">
                      Added on: {new Date(b.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <button
                    onClick={() => deleteBookmark(b.id)}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg transition"
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <button
          onClick={handleLogin}
          className="bg-black hover:bg-gray-900 text-white px-6 py-3 rounded-lg transition mt-20"
        >
          Sign in with Google
        </button>
      )}
    </div>
  );
}









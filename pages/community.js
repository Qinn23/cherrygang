import React, { useEffect, useState } from "react";
import Link from "next/link";

const OFFICIAL_ACCOUNT = "Cherry Gang — Official";

const OFFICIAL_POSTS = [
  {
    id: "official-1",
    author: OFFICIAL_ACCOUNT,
    content: "Use pomelo skin to wipe kitchen counters — it picks up dirt and leaves a fresh scent.",
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
    reactions: { good: 12, useless: 1 },
    media: {
      type: "image",
      url: "https://www.vietworldkitchen.com/wp-content/uploads/2018/12/candied-grapefruit-peel-trimmed.jpg",
    },
  },
  {
    id: "official-2",
    author: OFFICIAL_ACCOUNT,
    content: "Wipe car windows with an expired potato to reduce water beading — works surprisingly well.",
    createdAt: Date.now() - 1000 * 60 * 60 * 10,
    reactions: { good: 8, useless: 0 },
    media: {
      type: "video",
      url: "https://youtu.be/Nr0LYfWJnr0?si=2gSjliROu5429XEG",
    },
  },
  {
    id: "official-3",
    author: OFFICIAL_ACCOUNT,
    content: "Use a damp pomelo rind to shine wooden furniture — natural and chemical-free.",
    createdAt: Date.now() - 1000 * 60 * 30,
    reactions: { good: 3, useless: 0 },
    media: {
      type: "image",
      url: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80",
    },
  },
];

function formatTime(ts) {
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return "";
  }
}

function extractYouTubeId(url) {
  const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

export default function Community() {
  const [posts, setPosts] = useState([]);
  const [userReactions, setUserReactions] = useState({});
  const [pending, setPending] = useState([]);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitName, setSubmitName] = useState("");
  const [submitContent, setSubmitContent] = useState("");
  const [submitMediaType, setSubmitMediaType] = useState("none");
  const [submitMediaUrl, setSubmitMediaUrl] = useState("");
  const [submitFilesDataUrls, setSubmitFilesDataUrls] = useState([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("official_posts");
      const rawReactions = localStorage.getItem("official_user_reactions");
      const rawPending = localStorage.getItem("pending_submissions");

      let parsed = null;
      if (raw) {
        try { parsed = JSON.parse(raw); } catch (_) { parsed = null; }
      }

      if (parsed && Array.isArray(parsed) && parsed.length > 0) {
        setPosts(parsed);
      } else {
        // seed with OFFICIAL_POSTS when no posts exist
        setPosts(OFFICIAL_POSTS);
        localStorage.setItem("official_posts", JSON.stringify(OFFICIAL_POSTS));
      }

      if (rawReactions) {
        try { setUserReactions(JSON.parse(rawReactions)); } catch (_) {}
      }
      if (rawPending) {
        try { setPending(JSON.parse(rawPending)); } catch (_) {}
      }
    } catch (e) {
      setPosts(OFFICIAL_POSTS);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("official_posts", JSON.stringify(posts));
    } catch (e) {}
  }, [posts]);

  useEffect(() => {
    try {
      localStorage.setItem("pending_submissions", JSON.stringify(pending));
    } catch (e) {}
  }, [pending]);

  useEffect(() => {
    try {
      localStorage.setItem("official_user_reactions", JSON.stringify(userReactions));
    } catch (e) {}
  }, [userReactions]);

  useEffect(() => {
    // Sync post reaction counts based on OFFICIAL_POSTS (immutable) + userReactions
    const updated = OFFICIAL_POSTS.map((post) => {
      const userGave = userReactions[post.id];
      const baseGood = post.reactions.good || 0;
      const baseUseless = post.reactions.useless || 0;

      let good = baseGood;
      let useless = baseUseless;

      if (userGave === "good") good = baseGood + 1;
      if (userGave === "useless") useless = baseUseless + 1;

      return {
        ...post,
        reactions: { good, useless },
      };
    });

    setPosts(updated);
  }, [userReactions]);

  function handleReaction(postId, type) {
    setUserReactions((prev) => {
      const current = prev[postId] || null;
      const next = { ...prev };
      if (current === type) {
        // toggle off same reaction
        delete next[postId];
      } else {
        // switch or add reaction
        next[postId] = type;
      }
      return next;
    });
  }

  function submitLifeHack(e) {
    e.preventDefault();
    if (!submitContent.trim()) return alert("Please add a description for the life hack.");
    let mediaArray = [];
    
    if (submitMediaType === "upload" && submitFilesDataUrls.length > 0) {
      mediaArray = submitFilesDataUrls;
    } else if (submitMediaType === "url-image" && submitMediaUrl.trim()) {
      mediaArray = [{ type: "image", url: submitMediaUrl.trim() }];
    } else if (submitMediaType === "url-video" && submitMediaUrl.trim()) {
      mediaArray = [{ type: "video", url: submitMediaUrl.trim() }];
    }

    const submission = {
      id: `sub-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
      author: submitName.trim() || "Anonymous",
      content: submitContent.trim(),
      media: mediaArray.length > 0 ? mediaArray : null,
      createdAt: Date.now(),
      status: "pending",
    };
    setPending((p) => [submission, ...p]);
    setSubmitName("");
    setSubmitContent("");
    setSubmitMediaType("none");
    setSubmitMediaUrl("");
    setSubmitFilesDataUrls([]);
    alert("Thanks — your submission is queued for admin review.");
  }

  function approveSubmission(id) {
    const sub = pending.find((s) => s.id === id);
    if (!sub) return;
    const newPost = {
      id: `post-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
      author: sub.author || "Anonymous",
      content: sub.content,
      media: sub.media || null,
      createdAt: Date.now(),
      reactions: { good: 0, useless: 0 },
    };
    setPosts((ps) => [newPost, ...ps]);
    setPending((p) => p.filter((s) => s.id !== id));
  }

  function rejectSubmission(id) {
    setPending((p) => p.filter((s) => s.id !== id));
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Community Life Hacks — Official Feed</h1>
        <Link href="/" className="text-sm text-gray-600 underline">Back</Link>
      </div>

      <div className="space-y-6">

        <section className="rounded-lg border bg-white p-4 shadow-sm flex justify-end">
          <button onClick={() => setShowSubmitModal(true)} className="rounded bg-blue-600 hover:bg-blue-700 px-4 py-2 text-sm text-white">Share life hack</button>
        </section>

        {showSubmitModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="max-w-lg w-full bg-white rounded p-4">
              <h2 className="text-lg font-medium">Share a life hack</h2>
              <form
                onSubmit={(e) => {
                  submitLifeHack(e);
                  setShowSubmitModal(false);
                }}
                className="mt-3 flex flex-col gap-3"
              >
                <input
                  placeholder="Your name (optional)"
                  value={submitName}
                  onChange={(e) => setSubmitName(e.target.value)}
                  className="rounded border px-3 py-2 text-sm"
                />
                <textarea
                  placeholder="Describe your life hack — include steps and why it works"
                  value={submitContent}
                  onChange={(e) => setSubmitContent(e.target.value)}
                  rows={4}
                  className="rounded border px-3 py-2 text-sm"
                />
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <label className="inline-flex items-center gap-2">
                      <input type="radio" name="mediaChoice" value="none" checked={submitMediaType==="none"} onChange={() => { setSubmitMediaType("none"); setSubmitMediaUrl(""); setSubmitFilesDataUrls([]); }} />
                      No media
                    </label>
                    <label className="inline-flex items-center gap-2">
                      <input type="radio" name="mediaChoice" value="url-image" checked={submitMediaType==="url-image"} onChange={() => { setSubmitMediaType("url-image"); setSubmitFilesDataUrls([]); }} />
                      Image URL
                    </label>
                    <label className="inline-flex items-center gap-2">
                      <input type="radio" name="mediaChoice" value="url-video" checked={submitMediaType==="url-video"} onChange={() => { setSubmitMediaType("url-video"); setSubmitFilesDataUrls([]); }} />
                      Video URL
                    </label>
                    <label className="inline-flex items-center gap-2">
                      <input type="radio" name="mediaChoice" value="upload" checked={submitMediaType==="upload"} onChange={() => { setSubmitMediaType("upload"); setSubmitMediaUrl(""); }} />
                      Upload files
                    </label>
                  </div>

                  {submitMediaType === "upload" ? (
                    <div className="flex flex-col gap-3">
                      <label className="flex items-center justify-center w-full px-4 py-8 border-2 border-dashed border-blue-400 rounded-lg cursor-pointer bg-blue-50 hover:bg-blue-100 transition">
                        <div className="text-center">
                          <svg className="mx-auto h-8 w-8 text-blue-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                          </svg>
                          <p className="text-sm font-semibold text-blue-600">Click to upload or drag & drop</p>
                          <p className="text-xs text-gray-500">Upload multiple photos and/or videos (hold Ctrl/Cmd to select multiple)</p>
                        </div>
                        <input
                          type="file"
                          multiple
                          accept="image/*,video/*"
                          onChange={(e) => {
                            const files = e.target.files ? Array.from(e.target.files) : [];
                            const mediaItems = [];
                            let loadedCount = 0;

                            files.forEach((f) => {
                              const reader = new FileReader();
                              reader.onload = (ev) => {
                                mediaItems.push({
                                  type: f.type.startsWith("image") ? "image" : "video",
                                  url: ev.target.result,
                                  name: f.name,
                                });
                                loadedCount++;
                                if (loadedCount === files.length) {
                                  setSubmitFilesDataUrls((prev) => [...prev, ...mediaItems]);
                                }
                              };
                              reader.readAsDataURL(f);
                            });
                          }}
                          className="hidden"
                        />
                      </label>
                      {submitFilesDataUrls.length > 0 && (
                        <div className="border rounded-lg p-3 bg-gray-50">
                          <p className="text-sm font-semibold text-gray-700 mb-2">Selected files ({submitFilesDataUrls.length})</p>
                          <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                            {submitFilesDataUrls.map((media, idx) => (
                              <div key={idx} className="relative group">
                                {media.type === "image" && (
                                  <img src={media.url} alt="preview" className="h-24 w-full rounded object-cover" />
                                )}
                                {media.type === "video" && (
                                  <div className="relative h-24 w-full bg-black rounded flex items-center justify-center">
                                    <video src={media.url} className="h-24 w-full rounded object-cover" />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded">
                                      <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                                      </svg>
                                    </div>
                                  </div>
                                )}
                                <button
                                  type="button"
                                  onClick={() => setSubmitFilesDataUrls(submitFilesDataUrls.filter((_, i) => i !== idx))}
                                  className="absolute top-1 right-1 rounded-full bg-red-500 w-7 h-7 text-white text-sm flex items-center justify-center hover:bg-red-600 shadow-lg font-bold"
                                  title="Remove file"
                                >
                                  ✕
                                </button>
                                <p className="text-xs text-gray-600 mt-1 truncate">{media.name}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <input
                      placeholder="Media URL (optional)"
                      value={submitMediaUrl}
                      onChange={(e) => setSubmitMediaUrl(e.target.value)}
                      disabled={submitMediaType === "none"}
                      className={`flex-1 rounded border px-3 py-2 text-sm ${submitMediaType === "none" ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-white"}`}
                    />
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <button type="button" onClick={() => setShowSubmitModal(false)} className="rounded border px-4 py-2 text-sm">Cancel</button>
                  <button type="submit" className="rounded bg-blue-600 hover:bg-blue-700 px-4 py-2 text-sm text-white">Submit for review</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {posts.slice().sort((a,b)=> (b.createdAt||0) - (a.createdAt||0)).map((p) => (
          <article key={p.id} className="rounded-lg border bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="text-sm font-semibold text-gray-700">{p.author}</div>
                <div className="mt-2 text-gray-900">{p.content}</div>

                {p.media && (Array.isArray(p.media) ? p.media.length > 0 : p.media) && (
                  <div className="mt-3 grid gap-2">
                    {Array.isArray(p.media) ? (
                      p.media.map((m, idx) => {
                        const youtubeId = m.type === "video" ? extractYouTubeId(m.url) : null;
                        return (
                          <div key={idx}>
                            {m.type === "image" && (
                              <img src={m.url} alt="life hack" className="max-h-64 w-full rounded object-cover" />
                            )}
                            {m.type === "video" && youtubeId ? (
                              <iframe
                                src={`https://www.youtube.com/embed/${youtubeId}`}
                                title="life hack"
                                className="max-h-64 w-full rounded bg-black"
                                allowFullScreen
                                loading="lazy"
                              />
                            ) : m.type === "video" ? (
                              <video src={m.url} controls className="max-h-64 w-full rounded bg-black" />
                            ) : null}
                          </div>
                        );
                      })
                    ) : (
                      <>
                        {p.media.type === "image" && (
                          <img src={p.media.url} alt="life hack" className="max-h-64 w-full rounded object-cover" />
                        )}
                        {p.media.type === "video" && (() => {
                          const youtubeId = extractYouTubeId(p.media.url);
                          return youtubeId ? (
                            <iframe
                              src={`https://www.youtube.com/embed/${youtubeId}`}
                              title="life hack"
                              className="max-h-64 w-full rounded bg-black"
                              allowFullScreen
                              loading="lazy"
                            />
                          ) : (
                            <video src={p.media.url} controls className="max-h-64 w-full rounded bg-black" />
                          );
                        })()}
                      </>
                    )}
                  </div>
                )}

                <div className="mt-3 text-xs text-gray-500">{formatTime(p.createdAt)}</div>
              </div>

              <div className="flex flex-col items-end gap-2">
                <button
                  onClick={() => handleReaction(p.id, "good")}
                  className={`rounded px-3 py-1 text-sm ${userReactions[p.id] === "good" ? "bg-green-100" : "bg-gray-100"}`}
                >
                  👍 {p.reactions?.good ?? 0}
                </button>
                <button
                  onClick={() => handleReaction(p.id, "useless")}
                  className={`rounded px-3 py-1 text-sm ${userReactions[p.id] === "useless" ? "bg-red-100" : "bg-gray-100"}`}
                >
                  👎 {p.reactions?.useless ?? 0}
                </button>
              </div>
            </div>
          </article>
        ))}

        
      </div>
    </div>
  );
}

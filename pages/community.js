import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthContext";
import { db } from "@/firebase";
import { collection, addDoc, serverTimestamp, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore";

function formatTime(ts) {
  try { return new Date(ts).toLocaleString(); } catch { return ""; }
}

function extractYouTubeId(url) {
  const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

export default function Community() {
  const { profile, loading } = useAuth();
  const [posts, setPosts] = useState([]);
  const [submitContent, setSubmitContent] = useState("");
  const [submitMediaType, setSubmitMediaType] = useState("none");
  const [submitMediaUrl, setSubmitMediaUrl] = useState("");
  const [submitFilesDataUrls, setSubmitFilesDataUrls] = useState([]);
  const [posting, setPosting] = useState(false);

  const handleDeletePost = async (postId) => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    try {
      await deleteDoc(doc(db, "community_posts", postId));
      setPosts(prev => prev.filter(p => p.id !== postId));
    } catch (err) {
      console.error("Failed to delete post:", err);
      alert("Failed to delete post. Try again.");
    }
  };

  // Load posts from Firebase
  useEffect(() => {
    async function loadPosts() {
      try {
        const snapshot = await getDocs(collection(db, "community_posts"));
        const firebasePosts = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toMillis?.() || Date.now(),
          };
        });
        setPosts(firebasePosts);
      } catch (err) {
        console.error("Error loading posts:", err);
      }
    }
    loadPosts();
  }, []);

  // Handle file uploads
  const handleFileChange = (e) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (!files.length) return;
    const mediaItems = [];
    let loadedCount = 0;
    files.forEach(f => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        mediaItems.push({ type: f.type.startsWith("image") ? "image" : "video", url: ev.target.result });
        loadedCount++;
        if (loadedCount === files.length) setSubmitFilesDataUrls(prev => [...prev, ...mediaItems]);
      };
      reader.readAsDataURL(f);
    });
    setSubmitMediaType("upload");
  };

  // Submit post
  const submitPost = async (e) => {
    e.preventDefault();
    if (loading || !profile) return alert("You must be logged in to post.");
    if (!submitContent.trim()) return alert("Please write something before posting.");

    setPosting(true);

    let mediaArray = [];
    if (submitMediaType === "upload" && submitFilesDataUrls.length > 0) {
      mediaArray = submitFilesDataUrls.filter(m => m?.url).map(m => ({ type: m.type, url: m.url }));
    } else if (submitMediaType === "url-image" && submitMediaUrl.trim()) {
      mediaArray = [{ type: "image", url: submitMediaUrl.trim() }];
    } else if (submitMediaType === "url-video" && submitMediaUrl.trim()) {
      mediaArray = [{ type: "video", url: submitMediaUrl.trim() }];
    }

    const newPost = {
      authorId: profile.uid,
      authorName: profile.name || "Anonymous",
      householdId: profile.householdId || null,
      content: submitContent.trim(),
      reactions: { like: 0, unlike: 0 },
      createdAt: serverTimestamp(),
      ...(mediaArray.length > 0 && { media: mediaArray }),
    };

    try {
      const docRef = await addDoc(collection(db, "community_posts"), newPost);
      setPosts(prev => [{ ...newPost, id: docRef.id, createdAt: Date.now() }, ...prev]);
      setSubmitContent("");
      setSubmitMediaType("none");
      setSubmitMediaUrl("");
      setSubmitFilesDataUrls([]);
    } catch (err) {
      console.error("Failed to post:", err);
      alert("Failed to post. Try again.");
    } finally {
      setPosting(false);
    }
  };

  // Handle reaction
  const handleReaction = async (postId, type) => {
    try {
      const post = posts.find(p => p.id === postId);
      if (!post) return;
      const newCount = (post.reactions?.[type] || 0) + 1;
      await updateDoc(doc(db, "community_posts", postId), { [`reactions.${type}`]: newCount });
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, reactions: { ...p.reactions, [type]: newCount } } : p));
    } catch (err) {
      console.error("Failed to react:", err);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Community Life Hacks — Feed</h1>
        <Link href="/" className="text-sm text-gray-600 underline">Back</Link>
      </div>

      {/* Post form */}
      <section className="rounded-lg border bg-white p-4 shadow-sm mb-6">
        <form onSubmit={submitPost} className="flex flex-col gap-3">
          <textarea
            placeholder={loading ? "Loading..." : `What's on your mind, ${profile?.name || "Anonymous"}?`}
            value={submitContent}
            onChange={e => setSubmitContent(e.target.value)}
            rows={3}
            className="rounded border px-3 py-2 text-sm w-full resize-none"
          />
          {/* Media buttons */}
          <div className="flex gap-4 mt-1">
            <button
              type="button"
              onClick={() => setSubmitMediaType(submitMediaType === "url-image" ? "none" : "url-image")}
              className={`flex items-center gap-1 px-2 py-1 text-sm rounded hover:bg-gray-100 transition ${submitMediaType==="url-image"?"bg-gray-200":""}`}
            >🖼 Image URL</button>
            <button
              type="button"
              onClick={() => setSubmitMediaType(submitMediaType === "url-video" ? "none" : "url-video")}
              className={`flex items-center gap-1 px-2 py-1 text-sm rounded hover:bg-gray-100 transition ${submitMediaType==="url-video"?"bg-gray-200":""}`}
            >🎥 Video URL</button>
            <label className="flex items-center gap-1 px-2 py-1 text-sm rounded hover:bg-gray-100 transition cursor-pointer bg-gray-50">
              📁 Upload
              <input type="file" multiple accept="image/*,video/*" className="hidden" onChange={handleFileChange} />
            </label>
          </div>

          {(submitMediaType === "url-image" || submitMediaType === "url-video") && (
            <input
              type="text"
              placeholder={submitMediaType === "url-image" ? "Paste image URL..." : "Paste video URL..."}
              value={submitMediaUrl}
              onChange={e => setSubmitMediaUrl(e.target.value)}
              className="rounded border px-3 py-2 text-sm w-full"
            />
          )}

          {submitFilesDataUrls.length > 0 && (
            <div className="grid grid-cols-2 gap-2 mt-2">
              {submitFilesDataUrls.map((m, i) => (
                <div key={i} className="relative">
                  {m.type==="image" ? (
                    <img src={m.url} alt="preview" className="h-24 w-full rounded object-cover"/>
                  ) : (
                    <video src={m.url} className="h-24 w-full rounded object-cover"/>
                  )}
                  <button
                    type="button"
                    onClick={()=>setSubmitFilesDataUrls(submitFilesDataUrls.filter((_, idx)=>idx!==i))}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                  >✕</button>
                </div>
              ))}
            </div>
          )}

          <button
            type="submit"
            disabled={posting}
            className="self-end rounded bg-blue-600 hover:bg-blue-700 px-4 py-2 text-white text-sm mt-2"
          >
            {posting ? "Posting..." : "Post"}
          </button>
        </form>
      </section>

      {/* Posts list */}
      <div className="space-y-6">
        {posts.length === 0 && <p className="text-center text-gray-400">No posts yet.</p>}
        {posts.slice().sort((a,b)=> (b.createdAt||0) - (a.createdAt||0)).map(p => (
          <article key={p.id} className="relative rounded-lg border bg-white p-4 shadow-sm">
            {profile?.uid === p.authorId && (
              <button
                onClick={() => handleDeletePost(p.id)}
                className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-md transition"
                title="Delete your post"
              >🗑️</button>
            )}

            <div className="flex flex-col gap-2">
              <div className="text-sm font-semibold text-gray-700">Posted by {p.authorName || p.author}</div>
              <div className="text-gray-900">{p.content}</div>

              {p.media && (Array.isArray(p.media)?p.media:[p.media]).length>0 && (
                <div className="mt-3 grid gap-2">
                  {(Array.isArray(p.media)?p.media:[p.media]).map((m, idx) => {
                    const youtubeId = m.type==="video"?extractYouTubeId(m.url):null;
                    return (
                      <div key={idx}>
                        {m.type==="image" && <img src={m.url} alt="media" className="max-h-64 w-full rounded object-cover" loading="lazy"/>}
                        {m.type==="video" && youtubeId ? (
                          <iframe src={`https://www.youtube.com/embed/${youtubeId}`} title="video" className="max-h-64 w-full rounded bg-black" allowFullScreen loading="lazy"/>
                        ) : m.type==="video" ? (
                          <video src={m.url} controls className="max-h-64 w-full rounded bg-black"/>
                        ) : null}
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Reaction buttons */}
              <div className="flex gap-4 mt-2">
                <button
                  onClick={() => handleReaction(p.id, "like")}
                  className="flex items-center gap-1 text-sm text-green-600 hover:underline"
                >👍 {p.reactions?.like || 0}</button>
                <button
                  onClick={() => handleReaction(p.id, "unlike")}
                  className="flex items-center gap-1 text-sm text-red-600 hover:underline"
                >👎 {p.reactions?.unlike || 0}</button>
              </div>

              <div className="mt-1 text-xs text-gray-500">{formatTime(p.createdAt)}</div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
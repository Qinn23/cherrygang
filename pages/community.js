import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthContext";
import { db } from "@/firebase";
import { collection, addDoc, serverTimestamp, getDocs } from "firebase/firestore";

const OFFICIAL_ACCOUNT = "Cherry Gang — Official";
const OFFICIAL_POSTS = [
  {
    id: "official-1",
    author: OFFICIAL_ACCOUNT,
    content: "Use pomelo skin to wipe kitchen counters — it picks up dirt and leaves a fresh scent.",
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
    reactions: { good: 12, useless: 1 },
    media: [{ type: "image", url: "https://www.vietworldkitchen.com/wp-content/uploads/2018/12/candied-grapefruit-peel-trimmed.jpg" }],
  },
  {
    id: "official-2",
    author: OFFICIAL_ACCOUNT,
    content: "Wipe car windows with an expired potato to reduce water beading — works surprisingly well.",
    createdAt: Date.now() - 1000 * 60 * 60 * 10,
    reactions: { good: 8, useless: 0 },
    media: [{ type: "video", url: "https://youtu.be/Nr0LYfWJnr0?si=2gSjliROu5429XEG" }],
  },
  {
    id: "official-3",
    author: OFFICIAL_ACCOUNT,
    content: "Use a damp pomelo rind to shine wooden furniture — natural and chemical-free.",
    createdAt: Date.now() - 1000 * 60 * 30,
    reactions: { good: 3, useless: 0 },
    media: [{ type: "image", url: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80" }],
  },
];

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
  const [posting, setPosting] = useState(false); // disables button while posting

  // Load posts from Firebase
  useEffect(() => {
    async function loadPosts() {
      try {
        const snapshot = await getDocs(collection(db, "community_posts"));
        const firebasePosts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setPosts(firebasePosts.length ? firebasePosts : OFFICIAL_POSTS);
      } catch {
        setPosts(OFFICIAL_POSTS);
      }
    }
    loadPosts();
  }, []);

  const handleFileChange = (e) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (!files.length) return;

    const mediaItems = [];
    let loadedCount = 0;

    files.forEach(f => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        mediaItems.push({ type: f.type.startsWith("image") ? "image" : "video", url: ev.target.result, name: f.name });
        loadedCount++;
        if (loadedCount === files.length) setSubmitFilesDataUrls(prev => [...prev, ...mediaItems]);
      };
      reader.readAsDataURL(f);
    });
    setSubmitMediaType("upload");
  };

  const submitPost = async (e) => {
  e.preventDefault();
  if (loading) return;
  if (!profile) return alert("You must be logged in to post.");
  if (!submitContent.trim()) return alert("Please write something before posting.");

  setPosting(true);

  // Build media array safely
  let mediaArray = [];
  if (submitMediaType === "upload" && submitFilesDataUrls.length > 0) {
    mediaArray = submitFilesDataUrls
      .filter(m => m && m.url)       // remove null / undefined
      .map(m => ({ type: m.type, url: m.url })); // only keep type + url
  } else if (submitMediaType === "url-image" && submitMediaUrl.trim()) {
    mediaArray = [{ type: "image", url: submitMediaUrl.trim() }];
  } else if (submitMediaType === "url-video" && submitMediaUrl.trim()) {
    mediaArray = [{ type: "video", url: submitMediaUrl.trim() }];
  }

  // Construct Firestore document
  const newPost = {
    authorId: profile.uid,
    authorName: profile.name || "Anonymous",
    householdId: profile.householdId || null,
    content: submitContent.trim(),
    reactions: { good: 0, useless: 0 },
    createdAt: serverTimestamp(),
    // ✅ Only include media if array is not empty
    ...(mediaArray.length > 0 && { media: mediaArray }),
  };

  try {
    const docRef = await addDoc(collection(db, "community_posts"), newPost);

    // Update local state with JS timestamp
    setPosts(prev => [{ ...newPost, id: docRef.id, createdAt: Date.now() }, ...prev]);

    // Reset form
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
  if (loading) return <div>Loading...</div>;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Community Life Hacks — Feed</h1>
        <Link href="/" className="text-sm text-gray-600 underline">Back</Link>
      </div>

      <section className="rounded-lg border bg-white p-4 shadow-sm mb-6">
        <form onSubmit={submitPost} className="flex flex-col gap-3">
          <textarea
          placeholder={loading ? "Loading..." : `What's on your mind, ${profile?.name || "Anonymous"}?`}            value={submitContent}
            onChange={e => setSubmitContent(e.target.value)}
            rows={3}
            className="rounded border px-3 py-2 text-sm w-full resize-none"
          />

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

          {submitFilesDataUrls.length > 0 && (
            <div className="grid grid-cols-2 gap-2 mt-2">
              {submitFilesDataUrls.map((m, i) => (
                <div key={i} className="relative">
                  {m.type==="image" ? <img src={m.url} alt="preview" className="h-24 w-full rounded object-cover"/> :
                  <video src={m.url} className="h-24 w-full rounded object-cover"/>}
                  <button type="button" onClick={()=>setSubmitFilesDataUrls(submitFilesDataUrls.filter((_, idx)=>idx!==i))}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">✕</button>
                </div>
              ))}
            </div>
          )}

          <button type="submit" disabled={posting} className="self-end rounded bg-blue-600 hover:bg-blue-700 px-4 py-2 text-white text-sm mt-2">
            {posting ? "Posting..." : "Post"}
          </button>
        </form>
      </section>

      <div className="space-y-6">
        {posts.slice().sort((a,b)=> (b.createdAt||0) - (a.createdAt||0)).map(p => (
          <article key={p.id} className="rounded-lg border bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="text-sm font-semibold text-gray-700">Posted by {p.authorName || p.author}</div>
                <div className="mt-2 text-gray-900">{p.content}</div>

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

                <div className="mt-3 text-xs text-gray-500">{formatTime(p.createdAt)}</div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

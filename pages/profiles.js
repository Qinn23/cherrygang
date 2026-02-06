import React from "react";
import { loadProfiles, saveProfile, deleteProfile, splitCsv, normalizeToken } from "./firestoreProfiles";
import { useProfiles } from "@/components/ProfilesContext";
import { useAuth } from "@/components/AuthContext";
import { getOrCreateHouseholdInviteCode } from "@/lib/households";
import Link from "next/link";

function Field({ label, children, hint }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-zinc-800">{label}</span>
      <div className="mt-1">{children}</div>
      {hint ? <p className="mt-1 text-xs text-zinc-600">{hint}</p> : null}
    </label>
  );
}

function TextInput(props) {
  return (
    <input
      {...props}
      className={`w-full rounded-xl border border-amber-200/70 bg-white/80 px-3 py-2 text-sm text-zinc-900 shadow-sm ring-1 ring-inset ring-white/50 outline-none placeholder:text-zinc-400 focus:border-amber-300 focus:ring-amber-200/40 ${props.className ?? ""}`}
    />
  );
}

function ProfileEditor({ initial, onSave, onCancel }) {
  const [name, setName] = React.useState(initial?.name ?? "");
  const [allergies, setAllergies] = React.useState((initial?.allergies ?? []).join(", "));
  const [intolerances, setIntolerances] = React.useState((initial?.intolerances ?? []).join(", "));
  const [preferredFoods, setPreferredFoods] = React.useState((initial?.preferredFoods ?? []).join(", "));
  const [dislikedFoods, setDislikedFoods] = React.useState((initial?.dislikedFoods ?? []).join(", "));

  function submit(e) {
    e.preventDefault();
    const cleanName = String(name).trim();
    if (!cleanName) return;

    onSave({
      ...initial,
      name: cleanName,
      allergies: splitCsv(allergies),
      intolerances: splitCsv(intolerances),
      preferredFoods: splitCsv(preferredFoods),
      dislikedFoods: splitCsv(dislikedFoods),
      id: initial?.id ?? normalizeToken(cleanName) + "-" + String(Math.random()).slice(2, 6)
    });
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      <Field label="Name"><TextInput value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Dad" /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Allergies (hard exclude)" hint="Comma-separated. Example: nuts, shellfish">
          <TextInput value={allergies} onChange={e => setAllergies(e.target.value)} placeholder="nuts, shellfish" />
        </Field>
        <Field label="Intolerances (hard exclude)" hint="Comma-separated. Example: lactose, gluten">
          <TextInput value={intolerances} onChange={e => setIntolerances(e.target.value)} placeholder="lactose" />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Preferred foods (soft boost)" hint="Comma-separated. Example: spicy, mediterranean">
          <TextInput value={preferredFoods} onChange={e => setPreferredFoods(e.target.value)} placeholder="spicy" />
        </Field>
        <Field label="Disliked foods (soft avoid)" hint="Comma-separated. Example: mushrooms, olives">
          <TextInput value={dislikedFoods} onChange={e => setDislikedFoods(e.target.value)} placeholder="mushrooms" />
        </Field>
      </div>
      <div className="flex flex-wrap items-center gap-3 pt-2">
        <button type="submit" className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700">Save profile</button>
        <button type="button" onClick={onCancel} className="rounded-full bg-zinc-500/10 px-4 py-2 text-sm font-semibold text-zinc-800 ring-1 ring-inset ring-zinc-500/15 hover:bg-zinc-500/15">Cancel</button>
      </div>
    </form>
  );
}

export default function ProfilesPage() {
  const { household } = useAuth();
  const [profiles, setProfiles] = React.useState([]);
  const [editingId, setEditingId] = React.useState(null);
  const [isCreating, setIsCreating] = React.useState(false);
  const [showCodeModal, setShowCodeModal] = React.useState(false);
  const [inviteCode, setInviteCode] = React.useState("");
  const [codeLoading, setCodeLoading] = React.useState(false);

  React.useEffect(() => {
    async function fetchProfiles() {
      const data = await loadProfiles(household?.id);
      console.log("Loaded profiles for household:", household?.id, data);
      setProfiles(data);
    }
    if (household?.id) {
      fetchProfiles();
    }
  }, [household?.id]);

  const editing = profiles.find(p => p.id === editingId) ?? null;

  async function save(profile) {
    await saveProfile(profile);
    const next = profiles.some(p => p.id === profile.id)
      ? profiles.map(p => (p.id === profile.id ? profile : p))
      : [...profiles, profile];
    setProfiles(next);
    setEditingId(null);
    setIsCreating(false);
  }

  async function remove(id) {
    await deleteProfile(id);
    setProfiles(profiles.filter(p => p.id !== id));
    if (editingId === id) setEditingId(null);
  }

  async function generateAndShowCode() {
    console.log("Generate code clicked, household:", household);
    if (!household?.id) {
      alert("Household not loaded. Please refresh the page.");
      return;
    }
    
    setCodeLoading(true);
    try {
      const result = await getOrCreateHouseholdInviteCode(household.id);
      console.log("Code result:", result);
      if (result.success) {
        setInviteCode(result.code);
        setShowCodeModal(true);
      } else {
        alert("Failed to generate code: " + result.error);
      }
    } catch (error) {
      console.error("Error generating code:", error);
      alert("Error: " + error.message);
    } finally {
      setCodeLoading(false);
    }
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(inviteCode);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-orange-50 to-emerald-50 text-zinc-900">
      <header className="border-b border-amber-200/60 bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-6">
          <div>
            <p className="text-sm font-medium text-zinc-700">Smart Pantry</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">Family profiles</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/" className="rounded-full bg-zinc-500/10 px-4 py-2 text-sm font-semibold text-zinc-800 ring-1 ring-inset ring-zinc-500/15 hover:bg-zinc-500/15">Back to dashboard</Link>
            <button type="button" onClick={generateAndShowCode} disabled={codeLoading} className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60">
              {codeLoading ? "…" : "Generate code"}
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="grid gap-6 lg:grid-cols-3">
          <section className="lg:col-span-1 rounded-2xl border border-amber-200/60 bg-white/80 p-5 shadow-sm ring-1 ring-inset ring-white/50 backdrop-blur">
            <h2 className="text-base font-semibold tracking-tight text-zinc-900">Members</h2>
            <p className="mt-1 text-sm text-zinc-700">Select a profile to edit. Allergies/intolerances are used as filters when that person is selected as “eating”.</p>
            <div className="mt-4 space-y-3">
              {profiles.map(p => (
                <div key={p.id} className="rounded-xl border border-amber-200/60 bg-amber-50/60 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-zinc-900">{p.name}</p>
                      <p className="mt-1 text-sm text-zinc-700">Allergies: {p.allergies?.length ? p.allergies.join(", ") : "—"}</p>
                      <p className="mt-1 text-sm text-zinc-700">Intolerances: {p.intolerances?.length ? p.intolerances.join(", ") : "—"}</p>
                    </div>
                    <div className="flex shrink-0 flex-col gap-2">
                      <button type="button" onClick={() => { setEditingId(p.id); setIsCreating(false); }} className="rounded-full bg-white/70 px-3 py-1 text-sm font-semibold text-zinc-800 ring-1 ring-inset ring-amber-200/70 hover:bg-white">Edit</button>
                      <button type="button" onClick={() => remove(p.id)} className="rounded-full bg-rose-500/10 px-3 py-1 text-sm font-semibold text-rose-900 ring-1 ring-inset ring-rose-500/20 hover:bg-rose-500/15">Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
          <section className="lg:col-span-2 rounded-2xl border border-amber-200/60 bg-white/80 p-5 shadow-sm ring-1 ring-inset ring-white/50 backdrop-blur">
            <h2 className="text-base font-semibold tracking-tight text-zinc-900">{isCreating ? "Create profile" : editing ? `Edit ${editing.name}` : "Edit a profile"}</h2>
            <p className="mt-1 text-sm text-zinc-700">Preferences help rank recipes; allergies/intolerances can exclude recipes when that member is eating.</p>
            <div className="mt-4">
              {isCreating ? (
                <ProfileEditor initial={null} onSave={save} onCancel={() => setIsCreating(false)} />
              ) : editing ? (
                <ProfileEditor initial={editing} onSave={save} onCancel={() => setEditingId(null)} />
              ) : (
                <div className="rounded-xl border border-dashed border-amber-200/70 bg-white/60 p-4 text-sm text-zinc-700">Pick a member on the left, or click "Generate code" to invite others.</div>
              )}
            </div>
          </section>
        </div>
      </main>

      {/* Invite code modal */}
      {showCodeModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50">
          <div className="rounded-2xl border border-amber-200/60 bg-white p-6 shadow-lg max-w-sm w-full mx-4">
            <h2 className="text-lg font-semibold text-zinc-900">Invite family members</h2>
            <p className="mt-2 text-sm text-zinc-600">Share this code with other family members so they can join your household:</p>
            
            <div className="mt-4 flex items-center gap-2">
              <input
                type="text"
                value={inviteCode}
                readOnly
                className="flex-1 rounded-lg border border-amber-200/70 bg-amber-50 px-3 py-2 text-sm font-mono font-semibold text-zinc-900 outline-none"
              />
              <button
                type="button"
                onClick={copyToClipboard}
                className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
              >
                Copy
              </button>
            </div>
            
            <p className="mt-3 text-xs text-zinc-500">This code is permanent and can be shared with multiple people.</p>
            
            <button
              type="button"
              onClick={() => setShowCodeModal(false)}
              className="mt-4 w-full rounded-lg bg-zinc-500/10 px-4 py-2 text-sm font-semibold text-zinc-800 ring-1 ring-inset ring-zinc-500/15 hover:bg-zinc-500/15"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

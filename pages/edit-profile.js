import React from "react";
import { useRouter } from "next/router";
import { DM_Sans } from "next/font/google";
import { Card, CardBody, Button, Input } from "@heroui/react";
import Link from "next/link";
import { useAuth } from "@/components/AuthContext";
import { updateProfile, createProfile } from "@/lib/profiles";
import { deleteUser } from "firebase/auth";
import { auth } from "@/firebase";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export default function EditProfilePage() {
  const router = useRouter();
  const { profile, user, isAuthenticated, loading } = useAuth();
  const [formData, setFormData] = React.useState({
    name: "",
    allergies: "",
    intolerances: "",
    preferredFoods: "",
    dislikedFoods: "",
  });
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");
  const [deleting, setDeleting] = React.useState(false);
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);

  React.useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    if (profile) {
      setFormData({
        name: profile.name || "",
        allergies: (profile.allergies || []).join(", "),
        intolerances: (profile.intolerances || []).join(", "),
        preferredFoods: (profile.preferredFoods || []).join(", "),
        dislikedFoods: (profile.dislikedFoods || []).join(", "),
      });
    }
  }, [profile, isAuthenticated, loading, router]);

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      if (!formData.name.trim()) {
        setError("Name is required");
        setSaving(false);
        return;
      }

      const updates = {
        name: formData.name.trim(),
        allergies: formData.allergies
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean),
        intolerances: formData.intolerances
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean),
        preferredFoods: formData.preferredFoods
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean),
        dislikedFoods: formData.dislikedFoods
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean),
      };

      let result;

      if (profile && profile.id) {
        result = await updateProfile(profile.id, updates);
      } else {
        // create a new profile tied to the user's email
        const email = user?.email || "";
        result = await createProfile(email, updates);
        if (result.success) {
          // set profile id so context reload can pick it up
          // we don't directly set context here; subscribeToAuthState will reload profile
        }
      }

      if (result.success) {
        setSuccess("Profile saved successfully!");
        setTimeout(() => {
          router.push("/");
        }, 1500);
      } else {
        setError(result.error || "Failed to save profile");
      }
    } catch (err) {
      setError(err.message || "An error occurred");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteAccount() {
    setDeleting(true);
    setError("");

    try {
      if (!user) {
        setError("User not found");
        setDeleting(false);
        return;
      }

      // Delete the Firebase auth user
      await deleteUser(user);

      // Redirect to login
      router.push("/login");
    } catch (err) {
      setError(err.message || "Failed to delete account");
      setDeleting(false);
      setShowDeleteModal(false);
    }
  }

  if (loading) {
    return (
      <div className={`${dmSans.className} flex min-h-screen items-center justify-center bg-gradient-to-b from-emerald-50 via-white to-teal-50`}>
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div
      className={`${dmSans.className} flex min-h-screen flex-col bg-gradient-to-b from-emerald-50 via-white to-teal-50 text-slate-900`}
    >
      <header className="flex items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2 hover:opacity-90">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-xs font-semibold text-white shadow-sm">
            SP
          </div>
          <span className="text-sm font-medium tracking-tight text-slate-800">
            Smart Pantry
          </span>
        </Link>
        <Link href="/" className="text-sm text-emerald-600 hover:text-emerald-700">
          Back to Dashboard
        </Link>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 pb-10 pt-2">
        <div className="w-full max-w-md">
          <Card shadow="sm" className="border-none bg-white/70 backdrop-blur-md">
            <CardBody className="gap-6 p-6 sm:p-8">
              <div className="space-y-2 text-center">
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                  Edit Profile
                </h1>
                <p className="text-sm text-slate-500">
                  Update your dietary preferences and information
                </p>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="text-xs font-medium text-slate-700">
                    Name *
                  </label>
                  <Input
                    type="text"
                    name="name"
                    placeholder="Your name"
                    value={formData.name}
                    onChange={handleChange}
                    className="mt-1"
                    size="lg"
                    variant="bordered"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700">
                    Allergies
                  </label>
                  <Input
                    type="text"
                    name="allergies"
                    placeholder="E.g. nuts, shellfish, dairy"
                    value={formData.allergies}
                    onChange={handleChange}
                    className="mt-1"
                    size="lg"
                    variant="bordered"
                    description="Comma-separated list"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700">
                    Intolerances
                  </label>
                  <Input
                    type="text"
                    name="intolerances"
                    placeholder="E.g. lactose, gluten"
                    value={formData.intolerances}
                    onChange={handleChange}
                    className="mt-1"
                    size="lg"
                    variant="bordered"
                    description="Comma-separated list"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700">
                    Preferred Foods
                  </label>
                  <Input
                    type="text"
                    name="preferredFoods"
                    placeholder="E.g. spicy, sweet, salty"
                    value={formData.preferredFoods}
                    onChange={handleChange}
                    className="mt-1"
                    size="lg"
                    variant="bordered"
                    description="Comma-separated list"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700">
                    Disliked Foods
                  </label>
                  <Input
                    type="text"
                    name="dislikedFoods"
                    placeholder="E.g. mushrooms, olives"
                    value={formData.dislikedFoods}
                    onChange={handleChange}
                    className="mt-1"
                    size="lg"
                    variant="bordered"
                    description="Comma-separated list"
                  />
                </div>

                {error && (
                  <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="rounded-lg bg-green-50 p-3 text-sm text-green-600">
                    {success}
                  </div>
                )}

                <Button
                  type="submit"
                  isDisabled={saving}
                  className="h-10 rounded-lg bg-slate-900 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  {saving ? "Saving…" : "Save Profile"}
                </Button>

                <div className="border-t pt-4">
                  <Button
                    type="button"
                    onClick={() => setShowDeleteModal(true)}
                    isDisabled={deleting}
                    className="w-full h-10 rounded-lg bg-red-600 text-sm font-semibold text-white hover:bg-red-700"
                  >
                    {deleting ? "Deleting…" : "Delete Account"}
                  </Button>
                  <p className="text-xs text-slate-500 mt-2 text-center">
                    This action cannot be undone
                  </p>
                </div>
              </form>
            </CardBody>
          </Card>
        </div>
      </main>

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50">
          <div className="rounded-2xl border border-red-200 bg-white p-6 shadow-lg max-w-sm w-full mx-4">
            <h2 className="text-lg font-semibold text-slate-900">Delete Account?</h2>
            <p className="mt-2 text-sm text-slate-600">
              This will permanently delete your account and all associated data. This action cannot be undone.
            </p>
            
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="flex-1 rounded-lg bg-slate-500/10 px-4 py-2 text-sm font-semibold text-slate-800 ring-1 ring-inset ring-slate-500/15 hover:bg-slate-500/15 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

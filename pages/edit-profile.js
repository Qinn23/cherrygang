import React from "react";
import { useRouter } from "next/router";
import { DM_Sans } from "next/font/google";
import { Card, CardBody, Button, Input } from "@heroui/react";
import Link from "next/link";
import { useAuth } from "@/components/AuthContext";
import { updateProfile } from "@/lib/profiles";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export default function EditProfilePage() {
  const router = useRouter();
  const { profile, isAuthenticated, loading } = useAuth();
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

      const result = await updateProfile(profile.id, updates);

      if (result.success) {
        setSuccess("Profile updated successfully!");
        setTimeout(() => {
          router.push("/");
        }, 1500);
      } else {
        setError(result.error || "Failed to update profile");
      }
    } catch (err) {
      setError(err.message || "An error occurred");
    } finally {
      setSaving(false);
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
              </form>
            </CardBody>
          </Card>
        </div>
      </main>
    </div>
  );
}

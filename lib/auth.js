import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { auth } from "@/firebase";
import { createProfile, updateProfile } from "@/lib/profiles";
import { createHousehold } from "@/lib/households"; // ✅ REQUIRED

export async function loginWithEmail(email, password) {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: result.user };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function signupWithEmail(email, password) {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    const user = result.user;

    // 1. Create profile
    const profileResult = await createProfile(email, {
      uid: user.uid,
      name: email.split("@")[0],
      householdId: null,
    });

    if (!profileResult.success) {
      return { success: false, error: "Failed to create profile" };
    }

    // 2. Create household
    const householdResult = await createHousehold({
      name: `${email.split("@")[0]}'s household`,
      ownerUid: user.uid,
    });

    if (!householdResult.success) {
      return { success: false, error: "Failed to create household" };
    }

    // 3. Link profile → household (CRITICAL)
    await updateProfile(profileResult.id, {
      householdId: householdResult.id,
    });

    return {
      success: true,
      user,
      householdId: householdResult.id,
    };
  } catch (error) {
    console.error("Signup error:", error);
    return { success: false, error: error.message };
  }
}

export async function logout() {
  await signOut(auth);
}

export function subscribeToAuthState(callback) {
  return onAuthStateChanged(auth, callback);
}

export function getCurrentUser() {
  return auth.currentUser;
}

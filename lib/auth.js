import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { auth } from "@/firebase";
import { createProfile } from "@/lib/profiles";
import { createHousehold } from "@/lib/households";

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

    // Create profile for new user
    const profileResult = await createProfile(email, {
      uid: user.uid,
      name: email.split("@")[0], // default name
      householdId: null, // Will be set after household is created
    });

    if (!profileResult.success) {
      console.error("Failed to create profile:", profileResult.error);
      return { success: false, error: "Failed to create profile" };
    }

    // Create household for new user (they're the owner/sole member)
    const householdResult = await createHousehold({
      name: `${email.split("@")[0]}'s household`,
      ownerUid: user.uid,
      profileId: profileResult.id, // Pass profile ID to update it
    });

    if (!householdResult.success) {
      console.error("Failed to create household:", householdResult.error);
      return { success: false, error: "Failed to create household" };
    }

    return {
      success: true,
      user,
      profile: { id: profileResult.id, uid: user.uid, email, householdId: householdResult.id },
      householdId: householdResult.id,
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function logout() {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export function subscribeToAuthState(callback) {
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    callback(user);
  });
  return unsubscribe;
}

export function getCurrentUser() {
  return auth.currentUser;
}

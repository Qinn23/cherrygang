import "@/styles/globals.css";
import { ProfilesProvider } from "@/components/ProfilesContext";
import { AuthProvider } from "@/components/AuthContext";

export default function App({ Component, pageProps }) {
  return (
    <AuthProvider>
      <ProfilesProvider>
        <Component {...pageProps} />
      </ProfilesProvider>
    </AuthProvider>
  );
}

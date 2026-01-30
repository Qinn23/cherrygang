import "@/styles/globals.css";
import { ProfilesProvider } from "@/components/ProfilesContext";

export default function App({ Component, pageProps }) {
  return (
    <ProfilesProvider>
      <Component {...pageProps} />
    </ProfilesProvider>
  );
}

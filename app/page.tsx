import { HomeChat } from "./home-chat";

/**
 * Dev / standalone home: full-page chat.
 * Pass a bearer via NEXT_PUBLIC_DEV_LMS_TOKEN for local smoke.
 */
export default function Home() {
  return <HomeChat />;
}

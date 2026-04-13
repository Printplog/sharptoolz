import CookiePolicy from "@/components/Site/Cookies";
import { Helmet } from "react-helmet-async";

export default function CookiesPage() {
  return (
    <>
      <Helmet>
        <title>Cookie Policy | SharpToolz</title>
        <meta name="description" content="Understand how SharpToolz uses cookies to improve your user experience." />
      </Helmet>
      <CookiePolicy />
    </>
  );
}

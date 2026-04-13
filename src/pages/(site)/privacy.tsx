import PrivacyPolicy from "@/components/Site/Privacy";
import { Helmet } from "react-helmet-async";

export default function PrivacyPage() {
  return (
    <>
      <Helmet>
        <title>Privacy Policy | SharpToolz</title>
        <meta name="description" content="Learn how SharpToolz handles and protects your personal data and document generation privacy." />
      </Helmet>
      <PrivacyPolicy />
    </>
  );
}

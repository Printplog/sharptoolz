import TermsOfService from "@/components/Site/Terms";
import { Helmet } from "react-helmet-async";

export default function TermsPage() {
  return (
    <>
      <Helmet>
        <title>Terms of Service | SharpToolz</title>
        <meta name="description" content="Read our terms of service and usage license for the SharpToolz document automation platform." />
      </Helmet>
      <TermsOfService />
    </>
  );
}

import { useEffect, useState } from "react";

export default function GoogleCallback() {
  const [done, setDone] = useState(false);

  useEffect(() => {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const access_token = params.get("access_token");
    const error = params.get("error");

    const channel = new BroadcastChannel("google_auth");
    channel.postMessage({ type: "GOOGLE_AUTH", access_token, error });
    channel.close();

    setDone(true);
    window.close();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-black text-white gap-4">
      <p className="text-sm text-white/60">
        {done ? "Sign-in complete — you can close this window." : "Completing sign-in..."}
      </p>
      {done && (
        <button
          onClick={() => window.close()}
          className="text-xs px-4 py-2 rounded-full border border-white/20 hover:bg-white/10 transition-all"
        >
          Close window
        </button>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState("Processing authentication...");

  useEffect(() => {
    const handleAuth = async () => {
      try {
        // Check for error in query params
        const error = searchParams.get("error");
        if (error) {
          console.error("Auth error from params:", error);
          router.push(`/login?error=${error}`);
          return;
        }

        // Check for code parameter (PKCE flow)
        const code = searchParams.get("code");
        if (code) {
          setStatus("Exchanging code for session...");
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            console.error("Code exchange error:", exchangeError);
            router.push("/login?error=auth_error");
            return;
          }
          const next = searchParams.get("next") || "/dashboard";
          router.push(next);
          return;
        }

        // Check for hash fragment (implicit flow / OAuth tokens)
        const hash = window.location.hash;
        if (hash) {
          setStatus("Processing OAuth tokens...");
          // Parse the hash fragment
          const hashParams = new URLSearchParams(hash.substring(1));
          const accessToken = hashParams.get("access_token");
          const refreshToken = hashParams.get("refresh_token");

          if (accessToken) {
            // Set the session using the tokens from the hash
            const { data, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (sessionError) {
              console.error("Session error:", sessionError);
              router.push("/login?error=session_error");
              return;
            }

            if (data.session) {
              setStatus("Authentication successful! Redirecting...");
              const next = searchParams.get("next") || "/dashboard";
              router.push(next);
              return;
            }
          }
        }

        // Try to get existing session
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setStatus("Session found! Redirecting...");
          const next = searchParams.get("next") || "/dashboard";
          router.push(next);
          return;
        }

        // No valid auth method found
        setStatus("No authentication data found. Redirecting to login...");
        setTimeout(() => {
          router.push("/login?error=missing_params");
        }, 1500);

      } catch (err) {
        console.error("Auth callback error:", err);
        router.push("/login?error=auth_error");
      }
    };

    handleAuth();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">{status}</p>
      </div>
    </div>
  );
}

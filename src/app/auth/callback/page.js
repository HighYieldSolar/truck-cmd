"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState("Processing authentication...");

  // Check if user exists in the users table (has completed signup)
  const checkUserExists = async (userId, email) => {
    try {
      // First check by user ID
      const { data: userData, error } = await supabase
        .from('users')
        .select('id')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error checking user:', error);
        // If there's an error, allow the user through (fail-open for login)
        return true;
      }

      if (userData) return true;

      // Fallback: check by email in case ID doesn't match
      const { data: emailData } = await supabase
        .from('users')
        .select('id')
        .eq('email', email?.toLowerCase())
        .maybeSingle();

      return !!emailData;
    } catch (err) {
      console.error('Error checking user exists:', err);
      return true; // Fail-open
    }
  };

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

        // Determine if this is a login flow (redirect to dashboard) or signup flow (redirect to welcome)
        const next = searchParams.get("next") || "/dashboard";
        const isLoginFlow = next.includes('/dashboard') && !next.includes('new=true');

        // Check for code parameter (PKCE flow)
        const code = searchParams.get("code");
        if (code) {
          setStatus("Exchanging code for session...");
          const { data: exchangeData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            console.error("Code exchange error:", exchangeError);
            router.push("/login?error=auth_error");
            return;
          }

          // For login flow, check if user exists in the users table
          if (isLoginFlow && exchangeData?.session?.user) {
            const user = exchangeData.session.user;
            setStatus("Verifying account...");
            const userExists = await checkUserExists(user.id, user.email);

            if (!userExists) {
              // User doesn't exist - sign them out and redirect to signup
              await supabase.auth.signOut();
              router.push("/signup?error=no_account&email=" + encodeURIComponent(user.email || ''));
              return;
            }
          }

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
              // For login flow, check if user exists in the users table
              if (isLoginFlow && data.session.user) {
                const user = data.session.user;
                setStatus("Verifying account...");
                const userExists = await checkUserExists(user.id, user.email);

                if (!userExists) {
                  // User doesn't exist - sign them out and redirect to signup
                  await supabase.auth.signOut();
                  router.push("/signup?error=no_account&email=" + encodeURIComponent(user.email || ''));
                  return;
                }
              }

              setStatus("Authentication successful! Redirecting...");
              router.push(next);
              return;
            }
          }
        }

        // Try to get existing session
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          // For login flow, check if user exists in the users table
          if (isLoginFlow && session.user) {
            const user = session.user;
            setStatus("Verifying account...");
            const userExists = await checkUserExists(user.id, user.email);

            if (!userExists) {
              // User doesn't exist - sign them out and redirect to signup
              await supabase.auth.signOut();
              router.push("/signup?error=no_account&email=" + encodeURIComponent(user.email || ''));
              return;
            }
          }

          setStatus("Session found! Redirecting...");
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

function AuthCallbackFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
}

export default function AuthCallback() {
  return (
    <Suspense fallback={<AuthCallbackFallback />}>
      <AuthCallbackContent />
    </Suspense>
  );
}

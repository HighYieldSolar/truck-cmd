"use client";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function VerifyEmailComponent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token"); // Example: fetching token from URL

  return (
    <div>
      <h1>Verify Your Email</h1>
      {token ? <p>Verifying token: {token}</p> : <p>No token provided</p>}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <VerifyEmailComponent />
    </Suspense>
  );
}

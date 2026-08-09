import React, { useEffect, useRef } from "react";
import { signInWithCredential, GoogleAuthProvider } from "firebase/auth";
import { auth, oAuthClientId } from "../lib/firebase";

interface GoogleSignInButtonProps {
  onSuccess?: () => void;
  onError?: (error: any) => void;
}

export function GoogleSignInButton({ onSuccess, onError }: GoogleSignInButtonProps) {
  const buttonContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!window.google?.accounts?.id) {
      console.warn("Google Identity Services script not loaded");
      return;
    }

    try {
      window.google.accounts.id.initialize({
        client_id: oAuthClientId || "100813616906-qr9dl7r46pd7hdmp8qpu69d0a55bbk25.apps.googleusercontent.com",
        use_fedcm_for_prompt: false,
        callback: async (response: any) => {
          try {
            const credential = GoogleAuthProvider.credential(response.credential);
            await signInWithCredential(auth, credential);
            if (onSuccess) onSuccess();
          } catch (error) {
            console.error("Firebase sign in failed", error);
            if (onError) onError(error);
          }
        },
      });

      if (buttonContainerRef.current) {
        window.google.accounts.id.renderButton(
          buttonContainerRef.current,
          {
            theme: "outline",
            size: "large",
            type: "standard",
            text: "signin_with",
            shape: "rectangular",
          }
        );
      }
    } catch (e) {
      console.warn("Google One Tap button init error:", e);
    }
  }, [onSuccess, onError]);

  return <div ref={buttonContainerRef} className="google-signin-btn-container"></div>;
}

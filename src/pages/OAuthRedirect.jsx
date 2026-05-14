import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LoadingSpinner } from "../components/UI";
import { ensureCandidateProfile } from "../api/profileApi";

export default function OAuthRedirect() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get("token");
    const refreshToken = params.get("refreshToken");

    const bootstrap = async () => {
      if (!token) {
        navigate("/login", { replace: true });
        return;
      }

      const u = signIn({ token, refreshToken });
      if (u?.role === "CANDIDATE") {
        await ensureCandidateProfile(u);
        navigate("/jobs", { replace: true });
        return;
      }

      if (u?.role === "RECRUITER") {
        navigate("/recruiter/dashboard", { replace: true });
        return;
      }

      navigate("/jobs", { replace: true });
    };

    bootstrap();
  }, [location.search, navigate, signIn]);

  return (
    <div className="full-screen-center">
      <LoadingSpinner />
      <p style={{ marginTop: "1rem", color: "var(--text-secondary)" }}>
        Authenticating...
      </p>
    </div>
  );
}

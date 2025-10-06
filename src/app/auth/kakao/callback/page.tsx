"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/api/services/auth";
import Spinner from "react-bootstrap/Spinner";

export default function KakaoCallback() {
  const router = useRouter();
  const [status, setStatus] = useState("");
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    const params = new URL(window.location.href).searchParams;
    const authCode = params.get("code");
    const authError = params.get("error");

    if (authError || !authCode) {
      setIsError(true);
      setStatus("로그인 실패.... 잠시 후 이동합니다...");
      setTimeout(() => router.replace("/"), 1500);
      return;
    }

    setIsError(false);
    setStatus(`로딩 중.... 잠시 후 이동합니다...`);

    const fetchData = async () => {
      try {
        await login({ token: authCode })
        document.cookie = `pm_auth=1; path=/; max-age=${60 * 60 * 24 * 7}`;
        window.location.href = '/';
      } catch (err) {}
    };
    fetchData();

  }, [router]);

  return (
    <div style={{ minHeight: "80vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
      <Spinner animation="border" role="status" style={{ width: "15rem", height: "15rem" }}/>
      <div style={{ marginTop: "4rem", fontSize: "1.3rem", fontWeight: "700",  color: isError ? "red" : "black", textAlign: "center", maxWidth: "80%" }}>
        {status}
      </div>
    </div>
  );
}

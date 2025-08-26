"use client";

import { useEffect, useState } from "react";
import LogoIcon from "@/components/LogoIcon";
import { getMe, logout, type MeResponse } from "@/api/services/auth";
import { getAccessToken } from "@/api/utils/tokenStorage";
import "@/styles/header.css";

export default function Header() {
  const [user, setUser] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const handleKakaoLogin = () => {
    const clientId = process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY;
    const redirectUri = process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI;
    const authUrl = `https://kauth.kakao.com/oauth/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}`;
    window.location.href = authUrl;
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    window.location.href = "/";
  };

  let hasFetchedMe = false;

  useEffect(() => {
    if (hasFetchedMe) return;
    hasFetchedMe = true;

    const token = getAccessToken();
    if (!token) {
      setLoading(false);
      return;
    }

    getMe().then(setUser).finally(() => setLoading(false));
  }, []);
  
  return (
    <header className="header-container">
      <div className="logo">
        <LogoIcon />
        <span>PLANMATE</span>
      </div>
      {loading ? (
        <div className="loading-spacer" />
      ) : user ? (
        <div className="user-section">
          <img src={user.profileImage} alt="profile" className="profile-image" />
          <span className="nickname">{user.nickname}</span>
          <button onClick={handleLogout} className="logoutBtn">로그아웃</button>
        </div>
      ) : (
        <button
          className="kakaoBtn"
          onClick={handleKakaoLogin}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="12" cy="12" rx="12" ry="12" fill="#3C1E1E"/>
            <path d="M12 6C8.13 6 5 8.686 5 12c0 2.02 1.29 3.78 3.24 4.77-.09.7-.49 2.01-.56 2.23 0 0-.01.03.01.04.02.01.04.01.06 0 .25-.03 2.36-1.62 3.32-2.29.3.03.61.05.93.05 3.87 0 7-2.69 7-6s-3.13-6-7-6z" fill="#FEE500"/>
          </svg>
          카카오로 시작하기
        </button>
      )}
    </header>
  );
}

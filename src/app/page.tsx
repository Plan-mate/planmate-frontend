"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import "@/styles/mainPage.css";
import Header from "../components/Header";
import { getAccessToken } from "@/api/utils/tokenStorage";
const LoginRequiredModal = dynamic(() => import("@/components/LoginRequiredModal"), { ssr: false });

export default function Home() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const token = getAccessToken();
    if (token) {
      router.replace("/plan");
    }

    const sp = new URLSearchParams(window.location.search);

    if (sp.get('loginRequired') === '1') {
      setOpen(true);
      const url = new URL(window.location.href);
      url.searchParams.delete('loginRequired');
      window.history.replaceState({}, '', url.toString());
    }

    const cookieHasLoginRequired = document.cookie.split('; ').some((c) => c.startsWith('pm_login_required='));
    if (cookieHasLoginRequired) {
      setOpen(true);
      document.cookie = 'pm_login_required=; path=/; max-age=0';
    }
  }, [router]);

  return (
    <>
      <Header />
      {mounted ? <LoginRequiredModal open={open} onClose={() => setOpen(false)} /> : null}
      <main className="main-vertical">
        <section className="main-text-wide">
          <h1 className="introTitle">
            일정 관리, 이제 PlanMate로 쉽고 스마트하게!
          </h1>
          <p className="introDesc">
            일정 등록, 요약, 추천, 알림까지 한 번에. 누구나 직관적으로 사용할 수 있는 일정 관리 서비스입니다.
          </p>
        </section>
        <section className="main-cards-horizontal">
          <div className="card">
            <span className="cardIcon">📝</span>
            <div className="cardTitle">일정 등록</div>
            <div className="cardDesc">새 일정, 간편하게!</div>
          </div>
          <div className="card">
            <span className="cardIcon">📋</span>
            <div className="cardTitle">일정 요약</div>
            <div className="cardDesc">한눈에 보는 현황</div>
          </div>
          <div className="card">
            <span className="cardIcon">🌟</span>
            <div className="cardTitle">일정 추천</div>
            <div className="cardDesc">내게 맞는 일정 제안</div>
          </div>
          <div className="card">
            <span className="cardIcon">🔔</span>
            <div className="cardTitle">일정 알림</div>
            <div className="cardDesc">중요한 일정 미리 알림</div>
          </div>
        </section>
      </main>
      <footer className="footer">
        © {new Date().getFullYear()} PlanMate. All rights reserved.
      </footer>
    </>
  );
}

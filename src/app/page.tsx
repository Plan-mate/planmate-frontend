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
      return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('loginRequired') === '1') {
      setOpen(true);
      const url = new URL(window.location.href);
      url.searchParams.delete('loginRequired');
      window.history.replaceState({}, '', url.toString());
    }

    const hasLoginRequiredCookie = document.cookie
      .split('; ')
      .some(cookie => cookie.startsWith('pm_login_required='));
    
    if (hasLoginRequiredCookie) {
      setOpen(true);
      document.cookie = 'pm_login_required=; path=/; max-age=0';
    }
  }, [router]);

  const features = [
    { icon: "📝", title: "일정 등록", desc: "새 일정, 간편하게!" },
    { icon: "📋", title: "일정 요약", desc: "한눈에 보는 현황" },
    { icon: "🌟", title: "일정 추천", desc: "내게 맞는 일정 제안" },
    { icon: "🔔", title: "일정 알림", desc: "중요한 일정 미리 알림" }
  ];

  return (
    <>
      <Header />
      {mounted && <LoginRequiredModal open={open} onClose={() => setOpen(false)} />}
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
          {features.map((feature, index) => (
            <div key={index} className="card">
              <span className="cardIcon">{feature.icon}</span>
              <div className="cardTitle">{feature.title}</div>
              <div className="cardDesc">{feature.desc}</div>
            </div>
          ))}
        </section>
      </main>
      <footer className="footer">
        © {new Date().getFullYear()} PlanMate. All rights reserved.
      </footer>
    </>
  );
}

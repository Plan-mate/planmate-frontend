"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { getAccessToken } from "@/api/utils/tokenStorage";

export default function PlanPage() {
  const router = useRouter();

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.replace("/?loginRequired=1");
    }
  }, [router]);

  return (
    <>
      <Header />
      <main style={{ maxWidth: 900, margin: '40px auto', padding: '0 16px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>내 플랜</h1>
        <p style={{ marginTop: 8, color: '#555' }}>로그인된 사용자만 볼 수 있는 페이지입니다.</p>
        <section style={{ marginTop: 24, display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16 }}>
          <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 16 }}>가짜 카드 1</div>
          <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 16 }}>가짜 카드 2</div>
          <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 16 }}>가짜 카드 3</div>
          <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 16 }}>가짜 카드 4</div>
        </section>
      </main>
    </>
  );
}



import LogoIcon from "@/components/LogoIcon";

export default function Header() {
  return (
    <header className="header" style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      width: '100%', padding: '32px 0 24px 0', maxWidth: '900px', margin: '0 auto'
    }}>
      <div className="logo" style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.7rem', fontWeight: 700, color: '#2563eb' }}>
        <LogoIcon />
        <span>PLANMATE</span>
      </div>
      <button
        className="kakaoBtn"
        style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#fee500', color: '#3c1e1e', border: 'none', borderRadius: '999px', padding: '10px 22px', fontSize: '1rem', fontWeight: 600, boxShadow: '0 2px 8px #fee50044', cursor: 'pointer' }}
        onClick={() => alert('카카오 소셜 로그인 연동 예정!')}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="12" cy="12" rx="12" ry="12" fill="#3C1E1E"/>
          <path d="M12 6C8.13 6 5 8.686 5 12c0 2.02 1.29 3.78 3.24 4.77-.09.7-.49 2.01-.56 2.23 0 0-.01.03.01.04.02.01.04.01.06 0 .25-.03 2.36-1.62 3.32-2.29.3.03.61.05.93.05 3.87 0 7-2.69 7-6s-3.13-6-7-6z" fill="#FEE500"/>
        </svg>
        카카오로 시작하기
      </button>
    </header>
  );
}

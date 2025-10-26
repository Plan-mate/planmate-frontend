interface WeatherIconsProps {
  sky: string;
  hourlyDescription?: string;
}

export const SkyIcon = ({ sky }: { sky: string }) => {
  const s = 80;
  const c = "#666";
  
  switch (sky) {
    case '맑음':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" aria-hidden>
          <circle cx="12" cy="12" r="5" fill="#FDB813" />
        </svg>
      );
    case '구름많음':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" aria-hidden>
          <ellipse cx="9" cy="14" rx="6" ry="4" fill="#C0C6CF" />
          <ellipse cx="15" cy="14" rx="6" ry="4" fill="#D2D8E1" />
        </svg>
      );
    case '흐림':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" aria-hidden>
          <ellipse cx="10" cy="13" rx="7" ry="5" fill="#8B95A1" />
          <ellipse cx="16" cy="14.5" rx="7" ry="5.5" fill="#9AA4B2" />
          <rect x="5" y="19" width="14" height="2.2" rx="1.1" fill="#B0B8C1" />
          <rect x="7" y="22" width="12" height="2" rx="1" fill="#C4CAD2" />
        </svg>
      );
    default:
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" aria-hidden>
          <circle cx="12" cy="12" r="10" fill="none" stroke={c} strokeWidth="2" />
          <text x="12" y="16" textAnchor="middle" fontSize="10" fill={c}>?</text>
        </svg>
      );
  }
};

export const HourlyWeatherIcon = ({ description }: { description: string }) => {
  const size = 32;
  const stroke = "#5B6472";
  const cloudFill = "#B8C2CE";
  const cloudFill2 = "#C8D0DA";
  const sun1 = "#FDB813";
  const sun2 = "#FFE55C";
  const rain = "#4F8DD6";
  const snow = "#8EC8FF";

  const d = (description || '').trim();

  if (d.includes('비/눈') || d.includes('빗방울/눈날림')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
        <ellipse cx="9" cy="11" rx="6" ry="4" fill={cloudFill} />
        <ellipse cx="16" cy="12.5" rx="6" ry="4.5" fill={cloudFill2} />
        <path d="M8 17 L6 21" stroke={rain} strokeWidth="2" strokeLinecap="round" />
        <path d="M12 17 L10 21" stroke={rain} strokeWidth="2" strokeLinecap="round" />
        <path d="M16 17 L14 21" stroke={rain} strokeWidth="2" strokeLinecap="round" />
        <g stroke={snow} strokeWidth="1.6" strokeLinecap="round">
          <path d="M18 17 l0 3" />
          <path d="M16.8 18.2 l2.4 0" />
          <path d="M17 17.4 l2 2" />
          <path d="M19 17.4 l-2 2" />
        </g>
      </svg>
    );
  }

  if (d.includes('비')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
        <ellipse cx="9" cy="11" rx="6" ry="4" fill={cloudFill} />
        <ellipse cx="16" cy="12.5" rx="6" ry="4.5" fill={cloudFill2} />
        <path d="M8 17 L6 21" stroke={rain} strokeWidth="2.2" strokeLinecap="round" />
        <path d="M12 17 L10 21" stroke={rain} strokeWidth="2.2" strokeLinecap="round" />
        <path d="M16 17 L14 21" stroke={rain} strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    );
  }

  if (d.includes('빗방울')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
        <ellipse cx="9" cy="11" rx="6" ry="4" fill={cloudFill} />
        <ellipse cx="16" cy="12.5" rx="6" ry="4.5" fill={cloudFill2} />
        <path d="M9 17 L8 19" stroke={rain} strokeWidth="2" strokeLinecap="round" />
        <path d="M13 17 L12 19" stroke={rain} strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  if (d.includes('눈날림')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
        <ellipse cx="9" cy="11" rx="6" ry="4" fill={cloudFill} />
        <ellipse cx="16" cy="12.5" rx="6" ry="4.5" fill={cloudFill2} />
        <g stroke={snow} strokeWidth="1.5" strokeLinecap="round">
          <path d="M10 17 l0 2.5" />
          <path d="M9 18 l2 0" />
          <path d="M9.5 17.5 l1.5 1.5" />
          <path d="M11 17.5 l-1.5 1.5" />
        </g>
        <g stroke={snow} strokeWidth="1.5" strokeLinecap="round">
          <path d="M14 17 l0 2.5" />
          <path d="M13 18 l2 0" />
          <path d="M13.5 17.5 l1.5 1.5" />
          <path d="M15 17.5 l-1.5 1.5" />
        </g>
      </svg>
    );
  }

  if (d.includes('눈')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
        <ellipse cx="9" cy="11" rx="6" ry="4" fill={cloudFill} />
        <ellipse cx="16" cy="12.5" rx="6" ry="4.5" fill={cloudFill2} />
        <g stroke={snow} strokeWidth="1.8" strokeLinecap="round">
          <path d="M8 17 l0 3" />
          <path d="M6.8 18.2 l2.4 0" />
          <path d="M7 17.4 l2 2" />
          <path d="M9 17.4 l-2 2" />
        </g>
        <g stroke={snow} strokeWidth="1.8" strokeLinecap="round">
          <path d="M13 17 l0 3" />
          <path d="M11.8 18.2 l2.4 0" />
          <path d="M12 17.4 l2 2" />
          <path d="M14 17.4 l-2 2" />
        </g>
        <g stroke={snow} strokeWidth="1.8" strokeLinecap="round">
          <path d="M18 17 l0 3" />
          <path d="M16.8 18.2 l2.4 0" />
          <path d="M17 17.4 l2 2" />
          <path d="M19 17.4 l-2 2" />
        </g>
      </svg>
    );
  }

  if (d.includes('구름많음')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
        <ellipse cx="8" cy="11" rx="5" ry="3.5" fill={cloudFill} />
        <ellipse cx="15" cy="12" rx="5" ry="3.5" fill={cloudFill2} />
      </svg>
    );
  }

  if (d.includes('맑음')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
        <circle cx="12" cy="11" r="4" fill={sun1} />
        <circle cx="12" cy="11" r="6" fill={sun2} opacity="0.4" />
      </svg>
    );
  }

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="12" r="8" fill="none" stroke={stroke} strokeWidth="1.5" />
      <text x="12" y="15.5" textAnchor="middle" fontSize="8" fill={stroke}>?</text>
    </svg>
  );
};


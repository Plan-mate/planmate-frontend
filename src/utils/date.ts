export const getKoreaDate = (): Date => {
  const now = new Date();
  const koreaOffset = 9 * 60;
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const koreaTime = new Date(utc + (koreaOffset * 60000));
  return koreaTime;
};

export const getKoreaDateString = (): string => {
  const koreaTime = getKoreaDate();
  const year = koreaTime.getFullYear();
  const month = String(koreaTime.getMonth() + 1).padStart(2, '0');
  const day = String(koreaTime.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatDateYMD = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const todayYMD = (): string => {
  return formatDateYMD(getKoreaDate());
};

export const threeWeeksLaterYMD = (): string => {
  const d = getKoreaDate();
  d.setDate(d.getDate() + 21);
  return formatDateYMD(d);
};

export const roundToTenMinutes = (value: string): string => {
  if (!value) return value;
  const [datePart, timePart] = value.split('T');
  if (!timePart) return value;
  const [hh, mm] = timePart.split(':');
  const hours = Number(hh);
  const minutes = Number(mm);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return value;
  const rounded = Math.round(minutes / 10) * 10;
  let newHours = hours;
  let newMinutes = rounded;
  if (rounded === 60) {
    newMinutes = 0;
    newHours = (hours + 1) % 24;
  }
  const hhStr = String(newHours).padStart(2, '0');
  const mmStr = String(newMinutes).padStart(2, '0');
  return `${datePart}T${hhStr}:${mmStr}`;
};

export const calculateDurationInDays = (startTime: string, endTime: string): number => {
  if (!startTime || !endTime) return 0;
  const start = new Date(startTime);
  const end = new Date(endTime);
  const startDate = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const endDate = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  const diffTime = endDate.getTime() - startDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays + 1;
};

export const getCurrentMonthString = (): string => {
  const today = getKoreaDate();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
};

export const formatDisplayDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()];
  return `${month}월 ${day}일 (${dayOfWeek})`;
};

export const formatDisplayMonth = (monthStr: string): string => {
  const [year, month] = monthStr.split('-').map(Number);
  return `${year}년 ${month}월`;
};

export const formatDisplayTime = (dateTimeStr: string): string => {
  return dateTimeStr.split('T')[1].substring(0, 5);
};



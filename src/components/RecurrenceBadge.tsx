"use client";

import { Event } from "@/types/event";

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

function buildSummary(event: Event): { main: string; end?: string } | null {
  if (!event.isRecurring || !event.recurrenceRule) return null;
  const rule = event.recurrenceRule;
  const parts: string[] = [];
  if (rule.frequency === 'DAILY') parts.push('매일');
  if (rule.frequency === 'WEEKLY') parts.push('매주');
  if (rule.frequency === 'MONTHLY') parts.push('매월');

  if (rule.daysOfWeek && rule.daysOfWeek.length > 0) {
    const days = rule.daysOfWeek.map((d) => DAY_LABELS[parseInt(d)]).join(', ');
    parts.push(days);
  }
  if (rule.daysOfMonth && rule.daysOfMonth.length > 0) {
    parts.push(`${rule.daysOfMonth.join(', ')}일`);
  }
  const main = parts.join(' ');
  const end = rule.endDate ? new Date(rule.endDate).toLocaleDateString() : undefined;
  return { main, end };
}

export default function RecurrenceBadge({ event }: { event: Event }) {
  const summary = buildSummary(event);
  if (!summary) return null;
  return (
    <span className="pm-recur-badge" title={summary.end ? `종료 ${summary.end}` : undefined}>
      <svg className="pm-recur-badge__icon" width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M17 1v4h-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M7 23v-4h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M20.49 12A8.5 8.5 0 0 0 9 4.2L7 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        <path d="M3.51 12A8.5 8.5 0 0 0 15 19.8l2-0.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
      <span className="pm-recur-badge__text">{summary.main}</span>
      {summary.end && <span className="pm-recur-badge__end">~ {summary.end}</span>}
    </span>
  );
}



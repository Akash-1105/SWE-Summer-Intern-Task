import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isWithinInterval,
  isAfter,
  isBefore
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './WallCalendar.css';
// One unique image per month (now served from /public)
const monthImages = [
  '/january.png',   // Jan
  '/february.png',  // Feb
  '/march.png',     // Mar
  '/spring.png',     // Apr
  '/may.png',       // May
  '/summer.png',     // Jun
  '/july.png',      // Jul
  '/august.png',    // Aug
  '/autumn.png',     // Sep
  '/october.png',   // Oct
  '/november.png',  // Nov
  '/winter.png'     // Dec
];

interface Note {
  text: string;
  range?: string; // "Start Date - End Date"
}

export default function WallCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [hoverDate, setHoverDate] = useState<Date | null>(null);

  // Animation state
  const [isFlipping, setIsFlipping] = useState(false);

  // Load notes from local storage initially
  const [notes, setNotes] = useState<Note[]>(Array(6).fill({ text: '' }));

  useEffect(() => {
    const savedNotes = localStorage.getItem('calendar_notes');
    if (savedNotes) {
      try {
        setNotes(JSON.parse(savedNotes));
      } catch (e) {
        console.error("Failed to parse notes", e);
      }
    }
  }, []);


  const handleNoteChange = useCallback((index: number, value: string) => {
    setNotes(prev => {
      const newNotes = [...prev];
      let rangeBadge = undefined;

      if (value && startDate && endDate) {
        const startStr = format(startDate, 'MMM d');
        const endStr = format(endDate, 'MMM d');
        rangeBadge = `${startStr} - ${endStr}`;
      } else if (newNotes[index].range && value) {
        rangeBadge = newNotes[index].range;
      }

      newNotes[index] = { text: value, range: value ? rangeBadge : undefined };
      localStorage.setItem('calendar_notes', JSON.stringify(newNotes));
      return newNotes;
    });
  }, [startDate, endDate]);

  // Month change — instant image swap with calendar flip
  const changeMonth = useCallback((direction: 'next' | 'prev') => {
    if (isFlipping) return;
    setIsFlipping(true);

    setTimeout(() => {
      setCurrentDate(prev =>
        direction === 'next' ? addMonths(prev, 1) : subMonths(prev, 1)
      );
      setIsFlipping(false);
    }, 400);
  }, [isFlipping]);

  const nextMonth = useCallback(() => changeMonth('next'), [changeMonth]);
  const prevMonth = useCallback(() => changeMonth('prev'), [changeMonth]);

  const onDateClick = (day: Date) => {
    if (!startDate || (startDate && endDate)) {
      // Start a new range
      setStartDate(day);
      setEndDate(null);
    } else if (startDate && !endDate) {
      // Complete the range
      if (isBefore(day, startDate)) {
        setEndDate(startDate);
        setStartDate(day);
      } else {
        setEndDate(day);
      }
    }
  };

  const onDateHover = (day: Date) => {
    if (startDate && !endDate) {
      setHoverDate(day);
    } else {
      setHoverDate(null);
    }
  };

  // Generate calendar grid — memoized for performance
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDateGrid = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDateGrid = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const dateFormat = 'd';

  const calendarInterval = useMemo(
    () => eachDayOfInterval({ start: startDateGrid, end: endDateGrid }),
    [startDateGrid.getTime(), endDateGrid.getTime()]
  );

  const isDaySelected = useCallback((d: Date) => {
    if (startDate && isSameDay(d, startDate)) return true;
    if (endDate && isSameDay(d, endDate)) return true;
    return false;
  }, [startDate, endDate]);

  const isDayInRange = useCallback((d: Date) => {
    if (startDate && endDate) {
      return isWithinInterval(d, { start: startDate, end: endDate });
    }
    if (startDate && hoverDate) {
      const s = isBefore(startDate, hoverDate) ? startDate : hoverDate;
      const e = isAfter(startDate, hoverDate) ? startDate : hoverDate;
      return isWithinInterval(d, { start: s, end: e });
    }
    return false;
  }, [startDate, endDate, hoverDate]);

  const daysOfWeek = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

  // Current theme image based on month
  const themeImage = monthImages[currentDate.getMonth()];

  // Generate spiral coil data points for SVG path — mimics the C-shaped loops in the reference
  const generateCoils = (totalWidth: number, coilCount: number = 34) => {
    const spacing = totalWidth / coilCount;
    return Array.from({ length: coilCount }, (_, i) => {
      const cx = spacing * i + spacing / 2;
      return cx;
    });
  };

  return (
    <div className="calendar-wrapper">
      {/* Realistic SVG Spiral Binder */}
      <div className="spiral-binder-wrapper">
        <svg
          className="spiral-binder-svg"
          viewBox="0 0 900 60"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Metallic gradient for the wire coils */}
            <linearGradient id="coilGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#888" />
              <stop offset="40%" stopColor="#333" />
              <stop offset="60%" stopColor="#555" />
              <stop offset="100%" stopColor="#222" />
            </linearGradient>
            <linearGradient id="wireGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#555" />
              <stop offset="50%" stopColor="#111" />
              <stop offset="100%" stopColor="#333" />
            </linearGradient>
            {/* Nail head gradient */}
            <radialGradient id="nailGrad" cx="40%" cy="35%" r="60%">
              <stop offset="0%" stopColor="#ccc" />
              <stop offset="60%" stopColor="#888" />
              <stop offset="100%" stopColor="#444" />
            </radialGradient>
          </defs>

          {/* Horizontal backing bar the coils wrap around */}
          <rect x="0" y="28" width="900" height="5" fill="url(#wireGrad)" rx="2.5" />

          {/* Draw 34 coils evenly distributed, skip center 3 for hanger */}
          {generateCoils(900, 34).map((cx, i) => {
            const isCenter = i === 16 || i === 17;
            if (isCenter) return null; // gap for hanger hook

            // Each coil: a C-shape below and loop above the wire bar
            const x = cx;
            return (
              <g key={i}>
                {/* Coil loop: ellipse straddling the wire bar */}
                <ellipse
                  cx={x}
                  cy={30}
                  rx={6}
                  ry={18}
                  fill="none"
                  stroke="url(#coilGrad)"
                  strokeWidth="2.5"
                />
                {/* Small rear segment to give depth */}
                <ellipse
                  cx={x}
                  cy={30}
                  rx={6}
                  ry={18}
                  fill="none"
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth="1"
                />
              </g>
            );
          })}

          {/* Center hanger hook — V shape going up to the nail */}
          {/* Left arm of V */}
          <path
            d="M 423,30 C 423,30 430,10 450,5"
            fill="none"
            stroke="url(#wireGrad)"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          {/* Right arm of V */}
          <path
            d="M 477,30 C 477,30 470,10 450,5"
            fill="none"
            stroke="url(#wireGrad)"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          {/* Highlight sheen on hanger arms */}
          <path
            d="M 423,30 C 423,30 430,10 450,5"
            fill="none"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          <path
            d="M 477,30 C 477,30 470,10 450,5"
            fill="none"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="1.2"
            strokeLinecap="round"
          />

          {/* Nail / pin above the hanger */}
          <circle cx="450" cy="4" r="6" fill="rgba(0,0,0,0.25)" />
          <circle cx="450" cy="3.5" r="5" fill="url(#nailGrad)" />
          <circle cx="448" cy="2" r="2" fill="rgba(255,255,255,0.5)" />
          {/* Nail shank going up (into wall) */}
          <line x1="450" y1="0" x2="450" y2="-6" stroke="#666" strokeWidth="2" />
        </svg>
      </div>

      {/* SVG clip-paths — only rounding the specific bottom corners */}
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          {/* Left wave: only round the (0, 90%) bottom corner */}
          <clipPath id="leftWaveClip" clipPathUnits="objectBoundingBox">
            <path d="M 0,0.50 L 0.30,0.70 L 0.38,0.50 L 0.05,0.86 Q 0,0.90 0,0.85 Z" />
          </clipPath>
          {/* Right shape: only round the (90%, 100%) bottom corner */}
          <clipPath id="rightWaveClip" clipPathUnits="objectBoundingBox">
            <path d="M 0,0 L 1,0 L 1,0.85 L 0.93,0.96 Q 0.90,1.0 0.86,0.98 Z" />
          </clipPath>
          {/* Hero image: only round the V-point at (40%, 90%) */}
          <clipPath id="heroClip" clipPathUnits="objectBoundingBox">
            <path d="M 0,0 L 1,0 L 1,0.58 L 0.50,0.82 Q 0.40,0.90 0.30,0.83 L 0,0.72 Z" />
          </clipPath>
        </defs>
      </svg>

      <div className="calendar-hero-container">
        {/* Layer 1: Left blue decorative shape */}
        <div className="hero-decor-left"></div>
        {/* Layer 2: Right blue decorative shape */}
        <div className="hero-decor-right"></div>
        {/* Layer 3: Hero image */}
        <div className="hero-image-wrapper">
          <img
            src={themeImage}
            alt="Calendar Hero"
            className="calendar-hero-image"
          />
        </div>
        {/* Layer 4: Month/Year text */}
        <div className="calendar-month-indicator">
          <span className="calendar-year">{format(currentDate, 'yyyy')}</span>
          <h2>{format(currentDate, 'MMMM')}</h2>
        </div>
      </div>

      <div className={`calendar-body ${isFlipping ? 'month-flip-exit' : 'month-flip-enter'}`}>

        {/* Notes Section */}
        <div className="calendar-notes">
          <h3>Notes</h3>
          <div className="notes-list">
            {notes.map((note, idx) => (
              <div className="note-line" key={idx}>
                <input
                  type="text"
                  value={note.text}
                  onChange={(e) => handleNoteChange(idx, e.target.value)}
                  placeholder="..."
                />
                {note.text && (
                  <button
                    className="clear-note-btn"
                    onClick={() => handleNoteChange(idx, '')}
                    title="Clear Note"
                  >
                    ×
                  </button>
                )}
                {note.range && note.text && (
                  <span className="note-range-badge">{note.range}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Grid Section */}
        <div className="calendar-grid-container">
          <div className="calendar-header-actions">
            <button className="nav-btn" onClick={prevMonth} aria-label="Previous Month">
              <ChevronLeft size={20} />
            </button>
            <button className="nav-btn" onClick={nextMonth} aria-label="Next Month">
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="days-of-week">
            {daysOfWeek.map((dayName, idx) => (
              <span key={dayName} className={idx >= 5 ? 'weekend-header' : ''}>{dayName}</span>
            ))}
          </div>

          <div className="days-grid">
            {calendarInterval.map((d) => {
              const isMonthSame = isSameMonth(d, monthStart);
              const isToday = isSameDay(d, new Date());
              const isWeekend = d.getDay() === 0 || d.getDay() === 6;

              let classes = `day-cell ${isMonthSame ? '' : 'inactive'}`;

              if (isMonthSame && isWeekend) classes += ' active-weekend';
              if (isToday) classes += ' is-today';

              const selected = isDaySelected(d);
              const inRange = isDayInRange(d);

              if (selected && startDate && isSameDay(d, startDate)) classes += ' range-start';
              if (selected && endDate && isSameDay(d, endDate)) classes += ' range-end';
              if (inRange && (!selected || (startDate && endDate && isSameDay(startDate, endDate)))) {
                // The extra logic handles hover states and the case where start/end are the same
                classes += ' range-in-between';
              }

              // Adjust corners for start/end in range
              if (inRange && startDate && endDate && !isSameDay(startDate, endDate)) {
                if (isSameDay(d, startDate)) classes += ' range-in-between range-start';
                if (isSameDay(d, endDate)) classes += ' range-in-between range-end';
              }

              return (
                <div
                  key={d.toISOString()}
                  className={classes}
                  onClick={() => isMonthSame && onDateClick(d)}
                  onMouseEnter={() => isMonthSame && onDateHover(d)}
                >
                  <span>{format(d, dateFormat)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

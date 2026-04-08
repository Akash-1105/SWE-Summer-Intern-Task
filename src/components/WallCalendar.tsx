import { useState, useEffect } from 'react';
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

// Predefined themes/images based on months for "Theme Switching"
const monthImages = [
  "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?q=80&w=2000&auto=format&fit=crop", // Jan - Winter
  "https://images.unsplash.com/photo-1518457018318-7b947cbee95d?q=80&w=2000&auto=format&fit=crop", // Feb - Snow
  "https://images.unsplash.com/photo-1462275646964-a0e3386b89fa?q=80&w=2000&auto=format&fit=crop", // Mar - Spring transition
  "https://images.unsplash.com/photo-1490750967868-88cb431d102e?q=80&w=2000&auto=format&fit=crop", // Apr - Spring
  "https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?q=80&w=2000&auto=format&fit=crop", // May - Forest
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2000&auto=format&fit=crop", // Jun - Beach
  "https://images.unsplash.com/photo-1519046904884-53103b34b206?q=80&w=2000&auto=format&fit=crop", // Jul - Summer
  "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=2000&auto=format&fit=crop", // Aug - Lake
  "https://images.unsplash.com/photo-1444465693019-aa0b6392460a?q=80&w=2000&auto=format&fit=crop", // Sep - Autumn transition
  "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?q=80&w=2000&auto=format&fit=crop", // Oct - Fall
  "https://images.unsplash.com/photo-1504903271097-d2e7cfd60068?q=80&w=2000&auto=format&fit=crop", // Nov - Deep Fall
  "https://images.unsplash.com/photo-1483664852095-d6cc6870702d?q=80&w=2000&auto=format&fit=crop"  // Dec - Peak Winter
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

  // Flip animation state
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

  const saveNotes = (newNotes: Note[]) => {
    setNotes(newNotes);
    localStorage.setItem('calendar_notes', JSON.stringify(newNotes));
  };

  const handleNoteChange = (index: number, value: string) => {
    const newNotes = [...notes];
    let rangeBadge = undefined;

    // Automatically tag note to currently selected range
    if (value && startDate && endDate) {
      const startStr = format(startDate, 'MMM d');
      const endStr = format(endDate, 'MMM d');
      rangeBadge = `${startStr} - ${endStr}`;
    } else if (newNotes[index].range && value) {
      // Keep existing range if just editing text
      rangeBadge = newNotes[index].range;
    }

    newNotes[index] = { text: value, range: value ? rangeBadge : undefined };
    saveNotes(newNotes);
  };

  const nextMonth = () => {
    setIsFlipping(true);
    setTimeout(() => {
      setCurrentDate(addMonths(currentDate, 1));
      setIsFlipping(false);
    }, 500);
  };

  const prevMonth = () => {
    setIsFlipping(true);
    setTimeout(() => {
      setCurrentDate(subMonths(currentDate, 1));
      setIsFlipping(false);
    }, 500);
  };

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

  // Generate calendar grid
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDateGrid = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDateGrid = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const dateFormat = 'd';

  const calendarInterval = eachDayOfInterval({ start: startDateGrid, end: endDateGrid });

  const isDaySelected = (d: Date) => {
    if (startDate && isSameDay(d, startDate)) return true;
    if (endDate && isSameDay(d, endDate)) return true;
    return false;
  };

  const isDayInRange = (d: Date) => {
    if (startDate && endDate) {
      return isWithinInterval(d, { start: startDate, end: endDate });
    }
    if (startDate && hoverDate) {
      const s = isBefore(startDate, hoverDate) ? startDate : hoverDate;
      const e = isAfter(startDate, hoverDate) ? startDate : hoverDate;
      return isWithinInterval(d, { start: s, end: e });
    }
    return false;
  };

  const daysOfWeek = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

  // Unique UI Feature 1: Thematic image based on month index
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

      <div className="calendar-hero-container">
        <img
          src={themeImage}
          alt="Calendar Hero"
          className="calendar-hero-image"
        />
        {/* Playing Video Layer above the image */}
        <video 
          className="calendar-hero-video" 
          autoPlay 
          loop 
          muted 
          playsInline
          src="https://media.w3.org/2010/05/sintel/trailer_hd.mp4"
        />
        <div className="calendar-hero-overlay"></div>
        <div className="calendar-month-indicator">
          <h2>{format(currentDate, 'MMMM')}</h2>
          <span>{format(currentDate, 'yyyy')}</span>
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

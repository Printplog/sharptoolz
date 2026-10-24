import { useState, useEffect, useRef } from "react";
import { formatDate, parseDate, usesUppercaseNames } from "@/lib/utils/dateFormatter";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CustomDateTimePickerProps {
  value: string;
  onChange: (value: string) => void;
  format: string;
  disabled?: boolean;
  /** Template default, used to copy its style (e.g. "10 JAN 2025" keeps capitals) */
  sample?: string;
}

export default function CustomDateTimePicker({
  value,
  onChange,
  format,
  disabled = false,
  sample
}: CustomDateTimePickerProps) {
  // Strip [literal] text so letters inside it aren't mistaken for tokens
  const tokens = format.replace(/\[[^\]]*\]/g, "");
  const hasDate = /[YMD]/.test(tokens);
  const hasMinute = /m/.test(tokens);
  const hasSecond = /s/.test(tokens);
  const hasHour = /[Hh]/.test(tokens);
  const is12Hour = /h/.test(tokens) || /[Aa]/.test(tokens);
  const hasMeridian = /[Aa]/.test(tokens);
  const uppercase = usesUppercaseNames(value) || usesUppercaseNames(sample);

  const [dateTime, setDateTime] = useState<Date>(() => parseDate(value, format) ?? new Date());
  // Last value this picker showed/stored; starts as the incoming value
  const lastEmittedRef = useRef<string | null>(value || null);

  const emit = (next: Date) => {
    setDateTime(next);
    const formatted = formatDate(next, format, { uppercase });
    lastEmittedRef.current = formatted;
    onChange(formatted);
  };

  // Follow values set from outside (duplicate, dependencies, reset). An empty value —
  // on first render or cleared later — is filled with the shown date, so the picker
  // never displays a date the document doesn't have. Existing values are never rewritten.
  useEffect(() => {
    if (value === lastEmittedRef.current) return;
    if (!value) {
      emit(dateTime);
      return;
    }
    const parsed = parseDate(value, format);
    if (parsed) setDateTime(parsed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, format]);

  const meridian: 'AM' | 'PM' = dateTime.getHours() >= 12 ? 'PM' : 'AM';

  const handleDateChange = (value: string, component: 'year' | 'month' | 'day') => {
    const numValue = parseInt(value);
    if (isNaN(numValue)) return;

    const year = component === 'year' ? numValue : dateTime.getFullYear();
    const month = component === 'month' ? numValue - 1 : dateTime.getMonth();
    const wantedDay = component === 'day' ? numValue : dateTime.getDate();
    // Clamp the day to the new month's length (31 Jan -> Feb 28/29)
    const daysInNewMonth = new Date(year, month + 1, 0).getDate();

    emit(new Date(
      year,
      month,
      Math.min(wantedDay, daysInNewMonth),
      dateTime.getHours(),
      dateTime.getMinutes(),
      dateTime.getSeconds()
    ));
  };

  const handleTimeChange = (value: string, component: 'hour' | 'minute' | 'second') => {
    const numValue = parseInt(value);
    if (isNaN(numValue)) return;

    const newDateTime = new Date(dateTime);

    if (component === 'hour') {
      if (is12Hour) {
        // For 12-hour format, convert to 24-hour
        let hour24 = numValue;
        if (meridian === 'PM' && numValue !== 12) {
          hour24 = numValue + 12;
        } else if (meridian === 'AM' && numValue === 12) {
          hour24 = 0;
        }
        newDateTime.setHours(hour24);
      } else {
        newDateTime.setHours(numValue);
      }
    } else if (component === 'minute') {
      newDateTime.setMinutes(numValue);
    } else if (component === 'second') {
      newDateTime.setSeconds(numValue);
    }

    emit(newDateTime);
  };

  const handleMeridianChange = (value: string) => {
    const newMeridian = value as 'AM' | 'PM';
    const currentHour = dateTime.getHours();
    const newDateTime = new Date(dateTime);

    if (newMeridian === 'PM' && currentHour < 12) {
      newDateTime.setHours(currentHour + 12);
    } else if (newMeridian === 'AM' && currentHour >= 12) {
      newDateTime.setHours(currentHour - 12);
    }

    emit(newDateTime);
  };

  // Get display values for 12-hour format
  const getDisplayHour = () => {
    const hour = dateTime.getHours();
    if (hour === 0) return 12;
    if (hour > 12) return hour - 12;
    return hour;
  };

  const year = dateTime.getFullYear();
  const month = dateTime.getMonth() + 1;
  const day = dateTime.getDate();

  // Generate options for years (100 back for birth dates, 50 ahead), always including the selected year
  const yearOptions = [];
  const currentYear = new Date().getFullYear();
  const firstYear = Math.min(currentYear - 100, year);
  const lastYear = Math.max(currentYear + 50, year);
  for (let i = firstYear; i <= lastYear; i++) {
    yearOptions.push(i);
  }

  // Generate options for months
  const monthOptions = [
    { value: 1, label: 'January' }, { value: 2, label: 'February' },
    { value: 3, label: 'March' }, { value: 4, label: 'April' },
    { value: 5, label: 'May' }, { value: 6, label: 'June' },
    { value: 7, label: 'July' }, { value: 8, label: 'August' },
    { value: 9, label: 'September' }, { value: 10, label: 'October' },
    { value: 11, label: 'November' }, { value: 12, label: 'December' }
  ];

  // Generate options for days (1-31)
  const dayOptions = [];
  for (let i = 1; i <= 31; i++) {
    dayOptions.push(i);
  }

  // Get number of days in selected month
  const daysInMonth = new Date(year, month, 0).getDate();

  return (
    <div className="flex flex-wrap gap-2 items-end">
      {/* Date pickers - Year, Month, Day */}
      {hasDate && (
        <>
          {/* Year selector */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-400">Year</label>
            <Select value={year.toString()} onValueChange={(value) => handleDateChange(value, 'year')} disabled={disabled}>
              <SelectTrigger className="bg-white/10 border-white/20 text-white w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-white/20 max-h-60 z-[300]">
                {yearOptions.map((y) => (
                  <SelectItem key={y} value={y.toString()} className="text-white hover:bg-white/10">
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Month selector */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-400">Month</label>
            <Select value={month.toString()} onValueChange={(value) => handleDateChange(value, 'month')} disabled={disabled}>
              <SelectTrigger className="bg-white/10 border-white/20 text-white w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-white/20 z-[300]">
                {monthOptions.map((m) => (
                  <SelectItem key={m.value} value={m.value.toString()} className="text-white hover:bg-white/10">
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Day selector */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-400">Day</label>
            <Select value={day.toString()} onValueChange={(value) => handleDateChange(value, 'day')} disabled={disabled}>
              <SelectTrigger className="bg-white/10 border-white/20 text-white w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-white/20 max-h-60 z-[300]">
                {dayOptions.slice(0, daysInMonth).map((d) => (
                  <SelectItem key={d} value={d.toString()} className="text-white hover:bg-white/10">
                    {d.toString().padStart(2, '0')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      {/* Hour selector */}
      {hasHour && (
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-400">Hour</label>
          <Select
            value={(is12Hour ? getDisplayHour() : dateTime.getHours()).toString()}
            onValueChange={(value) => handleTimeChange(value, 'hour')}
            disabled={disabled}
          >
            <SelectTrigger className="bg-white/10 border-white/20 text-white w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-900 border-white/20 max-h-60 z-[300]">
              {is12Hour ? (
                // 12-hour format (1-12)
                [...Array(12)].map((_, i) => {
                  const hour = i + 1;
                  return (
                    <SelectItem key={hour} value={hour.toString()} className="text-white hover:bg-white/10">
                      {hour.toString().padStart(2, '0')}
                    </SelectItem>
                  );
                })
              ) : (
                // 24-hour format (0-23)
                [...Array(24)].map((_, i) => (
                  <SelectItem key={i} value={i.toString()} className="text-white hover:bg-white/10">
                    {i.toString().padStart(2, '0')}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Minute selector */}
      {hasMinute && (
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-400">Minute</label>
          <Select
            value={dateTime.getMinutes().toString()}
            onValueChange={(value) => handleTimeChange(value, 'minute')}
            disabled={disabled}
          >
            <SelectTrigger className="bg-white/10 border-white/20 text-white w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-900 border-white/20 max-h-60 z-[300]">
              {[...Array(60)].map((_, i) => (
                <SelectItem key={i} value={i.toString()} className="text-white hover:bg-white/10">
                  {i.toString().padStart(2, '0')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Second selector */}
      {hasSecond && (
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-400">Second</label>
          <Select
            value={dateTime.getSeconds().toString()}
            onValueChange={(value) => handleTimeChange(value, 'second')}
            disabled={disabled}
          >
            <SelectTrigger className="bg-white/10 border-white/20 text-white w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-900 border-white/20 max-h-60 z-[300]">
              {[...Array(60)].map((_, i) => (
                <SelectItem key={i} value={i.toString()} className="text-white hover:bg-white/10">
                  {i.toString().padStart(2, '0')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* AM/PM selector */}
      {hasMeridian && (
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-400">Period</label>
          <Select value={meridian} onValueChange={handleMeridianChange} disabled={disabled}>
            <SelectTrigger className="bg-white/10 border-white/20 text-white w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-900 border-white/20 z-[300]">
              <SelectItem value="AM" className="text-white hover:bg-white/10">AM</SelectItem>
              <SelectItem value="PM" className="text-white hover:bg-white/10">PM</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}


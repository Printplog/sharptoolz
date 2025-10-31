import { useState, useEffect } from "react";
import { formatDate } from "@/lib/utils/dateFormatter";
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
}

export default function CustomDateTimePicker({ 
  value, 
  onChange, 
  format,
  disabled = false 
}: CustomDateTimePickerProps) {
  // Parse the format to determine what components are needed
  // Check in order of most specific to least specific to avoid conflicts
  const hasDate = /[YMD]/.test(format);
  // For minute: look for mm specifically (not MM or MMM)
  const hasMinute = /\bmm\b/.test(format);
  // For second: look for ss specifically
  const hasSecond = /\bss\b/.test(format);
  // For hour: look for HH, H (24-hour) or hh, h (12-hour)
  const hasHour = /[Hh]/.test(format);
  // Check if it's 12-hour format (lowercase h or presence of AM/PM)
  const is12Hour = /[ha]/.test(format) || /[Aa]/.test(format);
  const hasMeridian = /[Aa]/.test(format);

  // Parse initial value or use current date/time
  const getInitialDate = () => {
    if (value && typeof value === 'string') {
      try {
        const parsed = new Date(value);
        if (!isNaN(parsed.getTime())) {
          return parsed;
        }
      } catch (e) {
        // ignore
      }
    }
    return new Date();
  };

  const [dateTime, setDateTime] = useState<Date>(getInitialDate());
  const [meridian, setMeridian] = useState<'AM' | 'PM'>(() => {
    return dateTime.getHours() >= 12 ? 'PM' : 'AM';
  });

  // Update parent when dateTime or meridian changes
  useEffect(() => {
    const formatted = formatDate(dateTime, format);
    onChange(formatted);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateTime, meridian, format]);

  const handleDateChange = (value: string, component: 'year' | 'month' | 'day') => {
    const numValue = parseInt(value);
    if (isNaN(numValue)) return;

    const newDate = new Date(dateTime);
    
    if (component === 'year') {
      newDate.setFullYear(numValue);
    } else if (component === 'month') {
      newDate.setMonth(numValue - 1);
    } else if (component === 'day') {
      newDate.setDate(numValue);
    }
    
    // Validate day after year/month changes (handle leap years and month lengths)
    const daysInNewMonth = new Date(newDate.getFullYear(), newDate.getMonth() + 1, 0).getDate();
    if (newDate.getDate() > daysInNewMonth) {
      newDate.setDate(daysInNewMonth);
    }
    
    // Preserve time components when updating date
    if (hasHour || hasMinute || hasSecond) {
      newDate.setHours(dateTime.getHours());
      newDate.setMinutes(dateTime.getMinutes());
      newDate.setSeconds(dateTime.getSeconds());
    }
    
    setDateTime(newDate);
    // Update meridian if needed
    if (hasMeridian && !is12Hour) {
      setMeridian(newDate.getHours() >= 12 ? 'PM' : 'AM');
    }
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
    
    setDateTime(newDateTime);
  };

  const handleMeridianChange = (value: string) => {
    const newMeridian = value as 'AM' | 'PM';
    setMeridian(newMeridian);
    
    // Update hours when meridian changes
    const currentHour = dateTime.getHours();
    const newDateTime = new Date(dateTime);
    
    if (newMeridian === 'PM' && currentHour < 12) {
      newDateTime.setHours(currentHour + 12);
    } else if (newMeridian === 'AM' && currentHour >= 12) {
      newDateTime.setHours(currentHour - 12);
    }
    
    setDateTime(newDateTime);
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

  // Generate options for years (current year ± 50 years)
  const yearOptions = [];
  const currentYear = new Date().getFullYear();
  for (let i = currentYear - 50; i <= currentYear + 50; i++) {
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
              <SelectContent className="bg-gray-900 border-white/20 max-h-60 z-[999999]">
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
              <SelectContent className="bg-gray-900 border-white/20 z-[999999]">
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
              <SelectContent className="bg-gray-900 border-white/20 max-h-60 z-[999999]">
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
            <SelectContent className="bg-gray-900 border-white/20 max-h-60 z-[999999]">
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
            <SelectContent className="bg-gray-900 border-white/20 max-h-60 z-[999999]">
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
            <SelectContent className="bg-gray-900 border-white/20 max-h-60 z-[999999]">
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
            <SelectContent className="bg-gray-900 border-white/20 z-[999999]">
              <SelectItem value="AM" className="text-white hover:bg-white/10">AM</SelectItem>
              <SelectItem value="PM" className="text-white hover:bg-white/10">PM</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}


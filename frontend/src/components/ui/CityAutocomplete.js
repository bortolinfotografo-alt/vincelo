'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { MapPin } from 'lucide-react';
import { CITIES } from '@/lib/cities';

function normalize(str) {
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export default function CityAutocomplete({
  value,
  onChange,
  hasError = false,
  placeholder = 'São Paulo, SP',
  inputClassName = 'input-field',
}) {
  const [options, setOptions] = useState([]);
  const [open, setOpen]           = useState(false);
  const [activeIndex, setActive]  = useState(-1);
  const wrapRef    = useRef(null);
  const debounceId = useRef(null);

  // Fecha ao clicar fora
  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const search = useCallback((val) => {
    if (val.length < 2) { setOptions([]); setOpen(false); return; }
    const q = normalize(val);
    const hits = CITIES.filter((c) => normalize(c).includes(q)).slice(0, 8);
    setOptions(hits);
    setOpen(hits.length > 0);
    setActive(-1);
  }, []);

  const handleChange = (e) => {
    const val = e.target.value;
    onChange(val);
    clearTimeout(debounceId.current);
    debounceId.current = setTimeout(() => search(val), 150);
  };

  const handleSelect = (city) => {
    onChange(city);
    setOpen(false);
    setOptions([]);
    setActive(-1);
  };

  const handleKeyDown = (e) => {
    if (!open) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, options.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0) handleSelect(options[activeIndex]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div ref={wrapRef} className="relative">
      <input
        type="text"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => options.length > 0 && setOpen(true)}
        placeholder={placeholder}
        autoComplete="off"
        className={`${inputClassName}${hasError ? ' border-red-400' : ''}`}
      />
      {open && (
        <ul className="absolute z-50 top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden max-h-52 overflow-y-auto">
          {options.map((city, i) => (
            <li
              key={city}
              onMouseDown={() => handleSelect(city)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm cursor-pointer transition-colors ${
                i === activeIndex
                  ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400'
                  : 'text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <MapPin size={12} className="text-gray-400 flex-shrink-0" />
              {city}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

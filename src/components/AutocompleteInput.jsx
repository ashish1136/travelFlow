import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Loader2, X } from 'lucide-react';
import { openTripMapService } from '../services/openTripMap';

const AutocompleteInput = ({ value, onChange, placeholder, className }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const [inputValue, setInputValue] = useState(value || '');

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (inputValue.length >= 3 && showDropdown) {
        setLoading(true);
        const results = await openTripMapService.getAutocomplete(inputValue);
        setSuggestions(results);
        setLoading(false);
      } else {
        setSuggestions([]);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [inputValue, showDropdown]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (item) => {
    setInputValue(item.city);
    onChange(item.city, { lat: item.lat, lon: item.lon });
    setSuggestions([]);
    setShowDropdown(false);
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputValue(val);
    setShowDropdown(true);
    if (!val) {
        onChange('', null);
    }
  };

  const clearInput = () => {
    setInputValue('');
    onChange('', null);
    setSuggestions([]);
  };

  return (
    <div className={`relative w-full ${className}`} ref={dropdownRef}>
      <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-2xl border border-transparent focus-within:border-primary/30 focus-within:bg-white focus-within:shadow-md transition-all w-full">
        <MapPin className="w-5 h-5 text-slate-400 shrink-0" />
        <input 
          type="text" 
          placeholder={placeholder}
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setShowDropdown(true)}
          className="bg-transparent border-none focus:outline-none w-full text-slate-700 font-medium placeholder:text-slate-400"
          autoComplete="off"
        />
        {loading ? (
          <Loader2 className="w-4 h-4 text-primary animate-spin" />
        ) : inputValue && (
          <button onClick={clearInput} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {showDropdown && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-[100] animate-in fade-in slide-in-from-top-1 duration-200">
          {suggestions.map((item, idx) => (
            <button
              key={idx}
              onClick={() => handleSelect(item)}
              className="w-full text-left px-5 py-4 hover:bg-slate-50 flex flex-col gap-1 transition-colors border-b border-slate-50 last:border-none"
            >
              <span className="font-bold text-slate-700 truncate">{item.label}</span>
              <span className="text-xs text-slate-400">Place in India</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default AutocompleteInput;

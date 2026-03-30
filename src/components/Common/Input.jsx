import React, { useState, useEffect, useRef } from 'react';
import '../../styles/input.css';
import { Eye, EyeOff } from 'lucide-react';

const Input = ({ icon: Icon, type = 'text', error, success, ...props }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isAutofilled, setIsAutofilled] = useState(false);
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const inputType = type === 'password' && showPassword ? 'text' : type;

  useEffect(() => {
    // Check if browser autofilled the input on load. We wait a tick because autofill
    // can apply after DOMContentLoaded. If there's a value and user didn't type it,
    // treat as autofilled and set a class to neutralize focus styles.
    const el = inputRef.current;
    if (!el) return;
    const check = () => {
      try {
        if (el.matches && el.matches(':-webkit-autofill')) {
          setIsAutofilled(true);
          return;
        }
      } catch (e) {
        // matches with pseudo-class might throw in some browsers; fallback to value check
      }
      if (el.value && el.value.length > 0) {
        setIsAutofilled(true);
      }
    };

    // run after a short delay to allow autofill to populate
    const id = window.setTimeout(check, 150);
    return () => window.clearTimeout(id);
  }, []);

  // When user focuses or types, clear autofill state
  const handleUserFocus = (e) => {
    setIsAutofilled(false);
    if (typeof props.onFocus === 'function') props.onFocus(e);
  };

  const handleUserChange = (e) => {
    setIsAutofilled(false);
    if (typeof props.onChange === 'function') props.onChange(e);
  };

  return (
    <div className="input-wrapper">
      <div
        ref={containerRef}
        className={`input-container ${error ? 'error' : ''} ${success ? 'success' : ''} ${isAutofilled ? 'autofilled' : ''}`}>
        {Icon && <Icon size={20} className="input-icon" />}
        <input
          ref={inputRef}
          type={inputType}
          className="input"
          onFocus={handleUserFocus}
          onChange={handleUserChange}
          {...props}
        />
        {type === 'password' && (
          <button
            type="button"
            className="password-toggle"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        )}
      </div>
      {error && <span className="input-error">{error}</span>}
    </div>
  );
};

export default Input;
"use client";

/**
 * RadioGroup - Reusable radio button group component with custom styling
 * Provides a fully accessible radio button group that works with dark theme
 * Uses custom radio controls instead of native inputs for better styling control
 */

import React, { useRef, KeyboardEvent } from "react";
import "./RadioGroup.css";

export interface RadioOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface RadioGroupProps {
  /**
   * Label for the radio group
   */
  label?: string;
  
  /**
   * Available options
   */
  options: RadioOption[];
  
  /**
   * Currently selected value
   */
  value: string;
  
  /**
   * Change handler
   */
  onChange: (value: string) => void;
  
  /**
   * Name attribute for the radio inputs (for form grouping)
   */
  name: string;
  
  /**
   * Whether the entire group is disabled
   */
  disabled?: boolean;
  
  /**
   * Optional CSS class
   */
  className?: string;
}

export function RadioGroup({
  label,
  options,
  value,
  onChange,
  name,
  disabled = false,
  className = "",
}: RadioGroupProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle keyboard navigation
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>, currentIndex: number) => {
    const enabledOptions = options.filter(opt => !opt.disabled && !disabled);
    const currentEnabledIndex = enabledOptions.findIndex(opt => opt.value === options[currentIndex].value);
    
    let newIndex = -1;
    
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        event.preventDefault();
        if (currentEnabledIndex < enabledOptions.length - 1) {
          newIndex = options.findIndex(opt => opt.value === enabledOptions[currentEnabledIndex + 1].value);
        } else {
          // Wrap to first enabled option
          newIndex = options.findIndex(opt => opt.value === enabledOptions[0].value);
        }
        break;
      
      case 'ArrowUp':
      case 'ArrowLeft':
        event.preventDefault();
        if (currentEnabledIndex > 0) {
          newIndex = options.findIndex(opt => opt.value === enabledOptions[currentEnabledIndex - 1].value);
        } else {
          // Wrap to last enabled option
          newIndex = options.findIndex(opt => opt.value === enabledOptions[enabledOptions.length - 1].value);
        }
        break;
      
      case ' ':
      case 'Enter':
        event.preventDefault();
        if (!disabled && !options[currentIndex].disabled) {
          onChange(options[currentIndex].value);
        }
        break;
    }
    
    if (newIndex !== -1) {
      const newOption = options[newIndex];
      onChange(newOption.value);
      
      // Focus the new option
      const optionElement = containerRef.current?.querySelector(
        `[data-value="${newOption.value}"]`
      ) as HTMLElement;
      optionElement?.focus();
    }
  };

  return (
    <div className={`im-radio-group ${className}`} ref={containerRef}>
      {label && (
        <div className="im-radio-group-label" id={`${name}-label`}>
          {label}
        </div>
      )}
      <div
        className="im-radio-group-options"
        role="radiogroup"
        aria-labelledby={label ? `${name}-label` : undefined}
        aria-required="false"
      >
        {options.map((option, index) => {
          const isSelected = value === option.value;
          const isDisabled = disabled || option.disabled;
          const optionId = `${name}-${option.value}`;
          
          return (
            <div
              key={option.value}
              data-value={option.value}
              role="radio"
              aria-checked={isSelected}
              aria-disabled={isDisabled}
              aria-describedby={option.description ? `${optionId}-desc` : undefined}
              tabIndex={isSelected && !isDisabled ? 0 : -1}
              className={`im-radio-option ${isSelected ? 'im-radio-option--selected' : ''} ${isDisabled ? 'im-radio-option--disabled' : ''}`}
              onClick={() => !isDisabled && onChange(option.value)}
              onKeyDown={(e) => handleKeyDown(e, index)}
            >
              {/* Hidden native input for form compatibility */}
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={isSelected}
                onChange={() => {}} // Controlled by parent onClick
                disabled={isDisabled}
                tabIndex={-1}
                className="im-radio-native-input"
                aria-hidden="true"
              />
              
              {/* Custom radio control */}
              <span className="im-radio-custom-control" aria-hidden="true">
                <span className="im-radio-custom-control-inner"></span>
              </span>
              
              <div className="im-radio-option-content">
                <span className="im-radio-option-label">{option.label}</span>
                {option.description && (
                  <span
                    id={`${optionId}-desc`}
                    className="im-radio-option-description"
                  >
                    {option.description}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

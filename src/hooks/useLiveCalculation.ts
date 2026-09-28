'use client';

import { useRef, useState } from 'react';
import type { CalculationResult } from '@/engine/types';

export type FieldError = { field: string; message: string };

function isFieldError(outcome: CalculationResult | FieldError): outcome is FieldError {
  return 'message' in outcome;
}

/**
 * `outcome` is recomputed on every render: a result, an error message, or an
 * error tied to a field id. Errors stay hidden until the first submit so an
 * empty form isn't shown as invalid; submitting scrolls to the result.
 */
export function useLiveCalculation(outcome: CalculationResult | string | FieldError) {
  const [submitted, setSubmitted] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  const failure =
    typeof outcome === 'string' ? { field: '', message: outcome } : isFieldError(outcome) ? outcome : null;
  const result = failure ? null : (outcome as CalculationResult);
  const error = submitted && failure ? failure.message : undefined;
  const errorFor = (field: string) => (submitted && failure?.field === field ? failure.message : undefined);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    const el = resultRef.current;
    // Side by side (desktop) the result is usually already on screen.
    if (result && el && el.getBoundingClientRect().top > window.innerHeight * 0.5) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  return { result, error, errorFor, handleSubmit, resultRef };
}

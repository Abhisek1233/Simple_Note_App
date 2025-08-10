import { useState, useCallback } from 'react';
import { type TextOptions } from '@/lib/types';

const defaultOptions: TextOptions = {
    fontFamily: 'Inter',
    textAlign: 'left',
    textColor: '#000000',
    highlightColor: 'transparent',
};

export const useTextOptions = (initialOptions?: Partial<TextOptions>) => {
  const [options, setOptions] = useState<TextOptions>({ ...defaultOptions, ...initialOptions });

  const setFontFamily = useCallback((font: string) => {
    setOptions(prev => ({ ...prev, fontFamily: font }));
  }, []);

  const setTextAlign = useCallback((align: 'left' | 'center' | 'right' | 'justify') => {
    setOptions(prev => ({ ...prev, textAlign: align }));
  }, []);

  const setTextColor = useCallback((color: string) => {
    setOptions(prev => ({ ...prev, textColor: color }));
  }, []);

  const setHighlightColor = useCallback((color: string) => {
    setOptions(prev => ({ ...prev, highlightColor: color }));
  }, []);

  const reset = useCallback(() => {
    setOptions(defaultOptions);
  }, []);
  
  const updateOptions = useCallback((newOptions: Partial<TextOptions>) => {
    setOptions(prev => ({...prev, ...newOptions}));
  }, []);

  return {
    options,
    setOptions: updateOptions,
    setFontFamily,
    setTextAlign,
    setTextColor,
    setHighlightColor,
    reset,
  };
};

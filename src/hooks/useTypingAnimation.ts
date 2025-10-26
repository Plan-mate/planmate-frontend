import { useEffect, useRef, useState } from 'react';

export const useTypingAnimation = (
  text: string,
  speed: number = 50,
  shouldStart: boolean = true
) => {
  const [displayText, setDisplayText] = useState('');
  const typingIndexRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!shouldStart || !text) {
      setDisplayText('');
      typingIndexRef.current = 0;
      return;
    }

    setDisplayText('');
    typingIndexRef.current = 0;

    intervalRef.current = setInterval(() => {
      typingIndexRef.current += 1;
      setDisplayText(text.slice(0, typingIndexRef.current));
      
      if (typingIndexRef.current >= text.length) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    }, speed);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [text, speed, shouldStart]);

  return displayText;
};


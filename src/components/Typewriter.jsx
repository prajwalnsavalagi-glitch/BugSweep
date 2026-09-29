import React, { useState, useEffect, useRef } from 'react';

export default function Typewriter({ text, speed = 45, startDelay = 0, cursor = true, className = '', onDone }) {
  const [displayed, setDisplayed] = useState('');
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    setDisplayed('');
    let i = 0;
    let interval;
    const startTimer = setTimeout(() => {
      interval = setInterval(() => {
        i++;
        setDisplayed(text.slice(0, i));
        if (i >= text.length) {
          clearInterval(interval);
          onDoneRef.current?.();
        }
      }, speed);
    }, startDelay);
    return () => {
      clearTimeout(startTimer);
      if (interval) clearInterval(interval);
    };
  }, [text, speed, startDelay]);

  return (
    <span className={className}>
      {displayed}
      {cursor && <span className="inline-block w-[7px] h-[1em] -mb-[2px] bg-accent align-middle ml-1 animate-blink" />}
    </span>
  );
}
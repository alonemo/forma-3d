import React, { useRef, useLayoutEffect, useState } from 'react';
import { Typography } from '@mui/material';

/**
 * Typography that adds a right-side fade only when text actually overflows
 * the clamped area (scrollHeight > clientHeight).
 * No fade is shown if text fits within the given number of lines.
 */
export default function FadeText({ lines = 2, lineHeight = 1.5, sx = {}, children, ...props }) {
  const ref = useRef(null);
  const [overflows, setOverflows] = useState(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (el) setOverflows(el.scrollHeight > el.clientHeight + 1);
  }, [children]);

  return (
    <Typography
      ref={ref}
      sx={{
        maxHeight: `${lines * lineHeight}em`,
        overflow: 'hidden',
        lineHeight,
        ...(overflows && {
          WebkitMaskImage: 'linear-gradient(to right, black 72%, transparent 100%)',
          maskImage: 'linear-gradient(to right, black 72%, transparent 100%)',
        }),
        ...sx,
      }}
      {...props}
    >
      {children}
    </Typography>
  );
}

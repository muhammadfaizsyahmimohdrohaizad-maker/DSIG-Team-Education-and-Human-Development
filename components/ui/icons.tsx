import type { SVGProps } from "react";

// A handful of inline icons. They are always paired with text, so they are hidden from screen readers.
function Icon(props: SVGProps<SVGSVGElement> & { children: React.ReactNode }) {
  const { children, ...rest } = props;
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" {...rest}>
      {children}
    </svg>
  );
}

export const FlagIcon = () => (
  <Icon><path d="M3 14V2" /><path d="M3 3h9l-2 3 2 3H3" /></Icon>
);
export const CheckIcon = () => (
  <Icon><path d="M3 8.5l3.2 3L13 4.5" /></Icon>
);
export const XIcon = () => (
  <Icon><path d="M4 4l8 8M12 4l-8 8" /></Icon>
);
export const ClockIcon = () => (
  <Icon><circle cx="8" cy="8" r="6" /><path d="M8 4.5V8l2.5 1.5" /></Icon>
);
export const InfoIcon = () => (
  <Icon><circle cx="8" cy="8" r="6" /><path d="M8 7.2V11M8 5v.01" /></Icon>
);
export const SearchIcon = () => (
  <Icon><circle cx="7" cy="7" r="4.5" /><path d="M10.5 10.5L14 14" /></Icon>
);
export const CircleIcon = () => (
  <Icon><circle cx="8" cy="8" r="5" /></Icon>
);

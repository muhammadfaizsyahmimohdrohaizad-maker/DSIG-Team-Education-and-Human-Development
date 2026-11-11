export function bookingTime(start: string) {
  return (
    new Intl.DateTimeFormat("en-MY", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Asia/Kuala_Lumpur",
    }).format(new Date(start)) + " MYT"
  );
}

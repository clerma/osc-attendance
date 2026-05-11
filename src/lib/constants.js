export const CAMPUSES = [
  "Broussard",
  "Lafayette",
  "Midtown",
  "New Iberia",
  "Opelousas",
  "Youngsville",
  "Abbeville",
  "Other",
];

export const SERVICE_TYPES = [
  "Sunday 8:00 AM",
  "Sunday 9:30 AM",
  "Sunday 11:00 AM",
  "Sunday Night",
  "Wednesday Night",
  "Special Event",
  "Candlelight Service",
  "Other",
];

export const AREAS = [
  "Sanctuary",
  "Kids Church",
  "Students",
  "Nursery",
  "Lobby / Overflow",
  "Other",
];

export const CONFIDENCE_META = {
  high: {
    label: "High confidence",
    accuracy: "±5–8%",
    color: "#1F568C",
    bg: "#A7CEF2",
    dots: 3,
  },
  medium: {
    label: "Medium confidence",
    accuracy: "±10–15%",
    color: "#468FD8",
    bg: "#DDE9F5",
    dots: 2,
  },
  low: {
    label: "Low confidence",
    accuracy: "±20%+",
    color: "#A8743C",
    bg: "#F4E6D2",
    dots: 1,
  },
};

export const PHOTO_BUCKET = "attendance-photos";

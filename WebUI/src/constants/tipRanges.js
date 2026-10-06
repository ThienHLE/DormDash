// US-08: Tip filter presets in cents, matching the /requests/list API.
export const TIP_RANGES = {
  "":        { label: "Any tip" },
  "under3":  { label: "Under $3",     tipMax: 299 },
  "3to6":    { label: "$3 – $5.99",   tipMin: 300, tipMax: 599 },
  "6to10":   { label: "$6 – $9.99",   tipMin: 600, tipMax: 999 },
  "10plus":  { label: "$10 or more",  tipMin: 1000 },
};
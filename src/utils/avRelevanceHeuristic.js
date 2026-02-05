export function looksAVRelevant(text) {
  if (!text) return false;
  const t = text.toLowerCase();

  // Strong AV anchors: if we see one of these, it's very likely AV-related
  const anchors = [
    "autonomous vehicle",
    "autonomous vehicles",
    "self-driving",
    "self driving",
    "driverless",
    "robotaxi",
    "robo-taxi",
    "adas", // keep as anchor, but it's broad — still OK if paired with others
    "full self-driving",
    "full self driving",
    "fsd",
    "autonomy", // OK as anchor (less ambiguous than "av")
    "lidar",
    "disengagement",
    "safety driver",
    "automated driving",
    "automated vehicle",

    // AV-first companies / programs
    "waymo",
    "cruise",
    "zoox",
    "mobileye",
    "aurora",
    "kodiak",
    "wayve",
    "baidu apollo",
    "apollo", // keep but see note below
    "pony.ai",
    "tusimple",
    "plus ai",
  ];

  // Boosters: only meaningful if an anchor exists
  const boosters = [
    "nhtsa",
    "unece",
    "regulation",
    "ride-hailing",
    "autonomous fleet",
    "v2x",
    "v2v",
    "perception",
    "path planning",
    "localization",
    "hd map",
    "hd maps",
    "sensor fusion",
    "radar",
    "camera",
    "autopilot",
    "tesla",
    "uber",
    "lyft",
  ];

  // Helper: avoid "av" style substring mistakes by requiring word boundaries
  // for short/ambiguous terms like "fsd" and "adas".
  const hasWord = (word) => {
    // For multi-word phrases, just use includes (word boundaries get messy)
    if (word.includes(" ")) return t.includes(word);
    // For single tokens, use boundaries
    const re = new RegExp(`\\b${escapeRegExp(word)}\\b`, "i");
    return re.test(t);
  };

  // 1) Must hit at least one anchor
  const anchorHit = anchors.some(hasWord);
  if (!anchorHit) return false;

  // 2) Optional: require either (a) a second anchor OR (b) any booster
  // This reduces cases where something like "camera" or "apollo" alone would slip through.
  const anchorCount = anchors.reduce((acc, a) => acc + (hasWord(a) ? 1 : 0), 0);
  const boosterHit = boosters.some(hasWord);

  // If we have 2+ anchors, definitely relevant. If only 1 anchor, require a booster.
  if (anchorCount >= 2) return true;
  return boosterHit;
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
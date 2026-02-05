export function looksAVRelevant(text) {
  if (!text) return false;
  const t = text.toLowerCase();

  // 1) Strong anchors: if ANY of these hit, we pass straight through.
  // These are unambiguous in your use case.
  const strongAnchors = [
    "robotaxi",
    "robo-taxi",
    "driverless",
    "self-driving",
    "self driving",
    "autonomous vehicle",
    "autonomous vehicles",
    "automated driving",
    "autonomous trucking",
    "autonomous truck",
    "waymo",
    "cruise",
    "zoox",
    "mobileye",
    "aurora",
    "kodiak",
    "wayve",
    "pony.ai",
    "pony ai",
    "tusimple",
    "plusai",     // <-- important: matches "PlusAI"
    "plus ai",    // keep variant
    "fsd",
    "full self-driving",
    "full self driving",
  ];

  // 2) Weaker anchors: these can appear in non-AV contexts.
  const weakAnchors = [
    "adas",
    "autonomy",
    "lidar",
    "disengagement",
    "safety driver",
    "automated vehicle",
    "baidu apollo",
    "apollo",
  ];

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

  const hasWord = (word) => {
    // If it includes spaces OR punctuation, boundary regex can be unreliable.
    // Use simple includes in those cases.
    const hasNonWord = /[^a-z0-9]/i.test(word);
    if (word.includes(" ") || hasNonWord) return t.includes(word);

    // For clean single tokens, use word boundaries.
    const re = new RegExp(`\\b${escapeRegExp(word)}\\b`, "i");
    return re.test(t);
  };

  // Strong anchor? Let it through immediately.
  if (strongAnchors.some(hasWord)) return true;

  // Otherwise require:
  // - at least one weak anchor AND
  // - either a second anchor OR any booster
  const weakHit = weakAnchors.some(hasWord);
  if (!weakHit) return false;

  const weakCount = weakAnchors.reduce((acc, a) => acc + (hasWord(a) ? 1 : 0), 0);
  const boosterHit = boosters.some(hasWord);

  if (weakCount >= 2) return true;
  return boosterHit;
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
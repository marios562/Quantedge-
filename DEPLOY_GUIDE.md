# ⚡ QuantEdge PWA — Οδηγός Deploy

## Τι είναι PWA;
Μια Progressive Web App εγκαθίσταται σαν native app (εικονίδιο στην οθόνη,
χωρίς browser chrome, offline support) αλλά είναι στην πραγματικότητα μια
web εφαρμογή. Zero App Store fees, instant updates.

---

## 📁 Δομή Αρχείων

```
quantedge-pwa/
├── index.html       ← Κύρια εφαρμογή (PWA-enabled)
├── manifest.json    ← PWA metadata (όνομα, εικονίδια, χρώματα)
├── sw.js            ← Service Worker (offline, caching, push)
└── icons/
    ├── icon-72.png
    ├── icon-96.png
    ├── icon-128.png
    ├── icon-192.png  ← Κύριο εικονίδιο
    └── icon-512.png  ← Splash screen / store
```

---

## 🚀 ΒΗΜΑ 1: Deploy σε Vercel (Δωρεάν - 5 λεπτά)

### Option A — Drag & Drop (απλούστερο)
1. Πήγαινε στο https://vercel.com
2. Κάνε Sign Up με GitHub
3. Dashboard → "Add New" → "Project"
4. Σύρε τον φάκελο `quantedge-pwa/` στην σελίδα
5. Click "Deploy" → ✅ Έτοιμο!

Θα σου δώσει URL: `https://quantedge-xxxx.vercel.app`

### Option B — Via GitHub (προτεινόμενο για updates)
```bash
# 1. Δημιούργησε GitHub repo
git init
git add .
git commit -m "QuantEdge PWA v1.0"
git push origin main

# 2. Στο Vercel → Import από GitHub
# 3. Κάθε git push = auto-deploy!
```

---

## 📱 ΒΗΜΑ 2: Εγκατάσταση ως App

### Android (Chrome)
1. Άνοιξε το URL στο Chrome
2. Θα εμφανιστεί banner "Εγκατάσταση QuantEdge"
3. Tap → Εγκατάσταση → Εικονίδιο στην οθόνη ✅

### iPhone (Safari) — ΣΗΜΑΝΤΙΚΟ: ΜΟΝΟ Safari
1. Άνοιξε το URL στο Safari (όχι Chrome)
2. Κάνε tap το κουμπί Share (□↑)
3. "Προσθήκη στην Αρχική Οθόνη"
4. Εγκατάσταση ✅

### Desktop (Chrome/Edge)
1. Άνοιξε το URL
2. Στη γραμμή διεύθυνσης → εικονίδιο εγκατάστασης (⊕)
3. "Εγκατάσταση QuantEdge" → ✅

---

## 🔌 ΒΗΜΑ 3: Real Data με FMP API ($20/μήνα)

### Εγγραφή
1. https://financialmodelingprep.com/developer/docs
2. Plan "Starter" → $19.99/μήνα
3. Αντέγραψε το API Key σου

### Σύνδεση με την εφαρμογή
Στο `index.html`, βρες τη γραμμή:
```javascript
const STOCKS = { ... }  // mock data
```

Αντικατάστησέ το με:
```javascript
const FMP_KEY = 'YOUR_API_KEY_HERE';

async function fetchRealData(ticker) {
  const [ratios, profile, growth, price] = await Promise.all([
    fetch(`https://financialmodelingprep.com/api/v3/ratios-ttm/${ticker}?apikey=${FMP_KEY}`).then(r => r.json()),
    fetch(`https://financialmodelingprep.com/api/v3/profile/${ticker}?apikey=${FMP_KEY}`).then(r => r.json()),
    fetch(`https://financialmodelingprep.com/api/v3/financial-growth/${ticker}?limit=1&apikey=${FMP_KEY}`).then(r => r.json()),
    fetch(`https://financialmodelingprep.com/api/v3/quote/${ticker}?apikey=${FMP_KEY}`).then(r => r.json()),
  ]);
  
  return buildQuantScore(ratios[0], profile[0], growth[0], price[0]);
}

function buildQuantScore(ratios, profile, growth, price) {
  // Valuation score (0-100 percentile)
  const peScore    = scoreMetric(ratios.peRatioTTM, 'pe', profile.sector);
  const psScore    = scoreMetric(ratios.priceToSalesRatioTTM, 'ps', profile.sector);
  const evScore    = scoreMetric(ratios.enterpriseValueMultipleTTM, 'ev', profile.sector);
  
  // Growth score
  const revGrowth  = scoreMetric(growth.revenueGrowth, 'growth', profile.sector);
  const epsGrowth  = scoreMetric(growth.epsgrowth, 'growth', profile.sector);
  
  // Profitability
  const grossM     = scoreMetric(ratios.grossProfitMarginTTM, 'margin', profile.sector);
  const roe        = scoreMetric(ratios.returnOnEquityTTM, 'roe', profile.sector);
  
  return {
    name: profile.companyName,
    sector: profile.sector,
    price: `$${price.price.toFixed(2)}`,
    change: price.changesPercentage,
    mktCap: formatMktCap(profile.mktCap),
    overallScore: calcOverall({ peScore, psScore, revGrowth, epsGrowth, grossM, roe }),
    // ... build full factors object
  };
}
```

---

## 💰 Κόστος Σύνοψη

| | Κόστος | Σημείωση |
|---|---|---|
| Vercel hosting | **€0** | Δωρεάν για personal |
| Domain (προαιρετικό) | ~€10/χρόνο | π.χ. quantedge.app |
| FMP API Starter | **~€19/μήνα** | 250 calls/ημέρα |
| **Σύνολο** | **~€20/μήνα** | Πλήρης εφαρμογή |

---

## 🗺️ Roadmap v1.1 → v2.0

```
v1.1 (2 εβδομάδες)
  ✅ Real FMP data connection
  ✅ Watchlist με localStorage
  ✅ Price alert notifications

v1.2 (1 μήνας)  
  ✅ User accounts (Supabase - δωρεάν)
  ✅ Personal portfolio tracking
  ✅ Historical score charts

v2.0 (3 μήνες)
  ✅ React Native mobile apps
  ✅ AI-powered commentary (Claude API)
  ✅ Sector screener (filter by grade)
  ✅ Export to PDF reports
```

---

## 🆘 Αν χρειαστείς βοήθεια
Κάθε βήμα παραπάνω μπορεί να γίνει μαζί με AI step-by-step.
Το μεγαλύτερο εμπόδιο είναι το FMP API integration — αλλά είναι ~50 γραμμές κώδικα.

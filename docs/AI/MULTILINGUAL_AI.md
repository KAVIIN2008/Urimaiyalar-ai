# 🌐 URIMAIYALAR OS — 22-LANGUAGE MULTILINGUAL AI ARCHITECTURE

## Core Principle: UI Localization ≠ AI Reasoning
In Urimaiyalar OS, multilingual capability is architected on two distinct, decoupled planes:

1. **Deterministic UI Localization (Client-side Dictionary)**:
   - Covers all 22 official Indian languages recognized by the 8th Schedule of the Indian Constitution.
   - 100% deterministic key-value dictionary in `src/i18n/locales/`.
   - Never depends on real-time LLM API calls for buttons, headers, or static labels.

2. **Multilingual AI Intent Understanding (Server-side Engine)**:
   - Understands native scripts (Tamil, Hindi, Telugu, Kannada, Bengali, etc.) and code-mixed transliterations (Tanglish, Hinglish, Manglish).
   - Maps language-agnostically to canonical business intents (`CREATE_SALE`, `GET_PROFIT`, `GET_INVENTORY`).
   - Generates answers in the merchant's chosen language with exact numbers preserved.

---

## 🗺️ Canonical Intent Mapping Matrix

| Input Phrase | Language & Script | Extracted Intent | Extracted Parameters | Tool Executed |
| :--- | :--- | :--- | :--- | :--- |
| `"Add 500 sales today"` | English | `ADD_SALE` | `{ amount: 500 }` | `create_sale` |
| `"இன்னைக்கு 500 ரூபாய் sales add பண்ணு"` | Tamil (Tamil script) | `ADD_SALE` | `{ amount: 500 }` | `create_sale` |
| `"Innaiku 500 rs cash sale add pannunga"` | Tamil (Tanglish) | `ADD_SALE` | `{ amount: 500, mode: 'CASH' }` | `create_sale` |
| `"500 रुपये की बिक्री जोड़ें"` | Hindi (Devanagari) | `ADD_SALE` | `{ amount: 500 }` | `create_sale` |
| `"Aaj 500 ki sale likh lo"` | Hindi (Hinglish) | `ADD_SALE` | `{ amount: 500 }` | `create_sale` |
| `"ఈరోజు 500 రూపాయల అమ్మకం చేర్చండి"` | Telugu | `ADD_SALE` | `{ amount: 500 }` | `create_sale` |
| `"ಇಂದು 500 ರೂಪಾಯಿ ಮಾರಾಟ ಸೇರಿಸಿ"` | Kannada | `ADD_SALE` | `{ amount: 500 }` | `create_sale` |
| `"ഇന്ന് 500 രൂപയുടെ വിൽപ്പന ചേർക്കുക"` | Malayalam | `ADD_SALE` | `{ amount: 500 }` | `create_sale` |

---

## 🇮🇳 The 22 Supported Indian Languages
1. **Tamil (தமிழ்)** — Primary anchor dialect
2. **Hindi (हिन्दी)**
3. **Telugu (తెలుగు)**
4. **Kannada (ಕನ್ನಡ)**
5. **Malayalam (മലയാളം)**
6. **Bengali (বাংলা)**
7. **Marathi (मराठी)**
8. **Gujarati (ગુજરાતી)**
9. **Punjabi (ਪੰਜਾਬੀ)**
10. **Odia (ଓଡ଼ିଆ)**
11. **Assamese (অসমীয়া)**
12. **Urdu (اردو)**
13. **Sanskrit (संस्कृतम्)**
14. **Kashmiri (کٲشُر)**
15. **Sindhi (سنڌي)**
16. **Konkani (कोंकणी)**
17. **Manipuri (মৈতৈলোন্)**
18. **Nepali (नेपाली)**
19. **Bodo (बड़ो)**
20. **Dogri (डोगरी)**
21. **Maithili (मैथिली)**
22. **Santhali (ᱥᱟᱱᱛᱟᱲᱤ)**
Plus **English** as the operational administrative lingua franca.

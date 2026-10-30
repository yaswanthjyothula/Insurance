import type { Messages } from "@/i18n/en";

/** "auth" messages in Hindi. */
const messages: Partial<Messages> = {
  "auth.session.checking": "आपका सत्र जाँचा जा रहा है…",
  "auth.session.restoreFailed": "हम आपका सत्र बहाल नहीं कर सके।",

  "auth.panel.createTitle": "अपना खाता बनाएँ",
  "auth.panel.subtitle": "अपना प्लान सहेजें और अपने सलाहकार के अपॉइंटमेंट देखें।",
  "auth.panel.tabsLabel": "साइन इन करें या खाता बनाएँ",
  "auth.panel.tabCreate": "खाता बनाएँ",
  "auth.panel.or": "या",
  "auth.panel.advisorQuestion": "क्या आप सलाहकार हैं?",
  "auth.panel.advisorLink": "सलाहकार पोर्टल में साइन इन करें",

  "auth.signIn.idLabel": "आईडी या ईमेल पता",
  "auth.signIn.idPlaceholder": "CUS-06ISGGSQ या name@example.com",
  "auth.signIn.password": "पासवर्ड",
  "auth.signIn.busy": "साइन इन हो रहा है…",
  "auth.signIn.failed": "हम आपको साइन इन नहीं कर सके। कृपया फिर कोशिश करें।",

  "auth.register.fullName": "पूरा नाम",
  "auth.register.email": "ईमेल पता",
  "auth.register.emailPlaceholder": "name@example.com",
  "auth.register.passwordLabel": "पासवर्ड (कम से कम {min} अक्षर)",
  "auth.register.confirm": "पासवर्ड की पुष्टि करें",
  "auth.register.busy": "खाता बन रहा है…",
  "auth.register.failed": "हम आपका खाता नहीं बना सके। कृपया फिर कोशिश करें।",

  "auth.validation.idOrEmail": "अपनी आईडी या सही ईमेल पता दर्ज करें।",
  "auth.validation.password": "अपना पासवर्ड दर्ज करें।",
  "auth.validation.fullName": "अपना पूरा नाम दर्ज करें।",
  "auth.validation.email": "सही ईमेल पता दर्ज करें।",
  "auth.validation.passwordMin": "कम से कम 8 अक्षर रखें।",
  "auth.validation.mismatch": "दोनों पासवर्ड एक जैसे नहीं हैं।",

  "auth.signedIn.demoCustomer": "डेमो ग्राहक के रूप में साइन इन हैं",
  "auth.signedIn.demoAdvisor": "डेमो सलाहकार के रूप में साइन इन हैं",
  "auth.signedIn.demoAdmin": "डेमो एडमिन के रूप में साइन इन हैं",
  "auth.signedIn.plain": "साइन इन हैं",
  "auth.signedIn.openAdvisor": "सलाहकार कार्यक्षेत्र खोलें",

  "auth.demo.opening": "डेमो खुल रहा है…",
  "auth.demo.customerButton": "डेमो ग्राहक के रूप में जारी रखें (काल्पनिक)",
  "auth.demo.customerNote": "साइन-अप की ज़रूरत नहीं। डेमो ग्राहक का डेटा गढ़ा हुआ है, कोई असली व्यक्ति नहीं।",
  "auth.demo.customerFailed": "डेमो ग्राहक अभी उपलब्ध नहीं है।",
  "auth.demo.advisorLabel": "सलाहकार कार्यक्षेत्र (काल्पनिक)",
  "auth.demo.advisorOpening": "खुल रहा है…",
  "auth.demo.advisorButton": "सलाहकार के रूप में खोलें",
  "auth.demo.advisorFailed": "डेमो सलाहकार अभी उपलब्ध नहीं है।",

  "auth.signUp.opening": "रजिस्ट्रेशन खुल रहा है…",
};

export default messages;

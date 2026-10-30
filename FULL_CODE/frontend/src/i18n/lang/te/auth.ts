import type { Messages } from "@/i18n/en";

/** "auth" messages in Telugu. */
const messages: Partial<Messages> = {
  "auth.session.checking": "మీ సెషన్‌ను తనిఖీ చేస్తున్నాము…",
  "auth.session.restoreFailed": "మీ సెషన్‌ను పునరుద్ధరించలేకపోయాము.",

  "auth.panel.createTitle": "మీ ఖాతాను సృష్టించండి",
  "auth.panel.subtitle": "మీ ప్లాన్‌ను సేవ్ చేసుకోండి, మీ సలహాదారు అపాయింట్‌మెంట్లను చూడండి.",
  "auth.panel.tabsLabel": "సైన్ ఇన్ చేయండి లేదా ఖాతా సృష్టించండి",
  "auth.panel.tabCreate": "ఖాతా సృష్టించండి",
  "auth.panel.or": "లేదా",
  "auth.panel.advisorQuestion": "మీరు సలహాదారా?",
  "auth.panel.advisorLink": "సలహాదారు పోర్టల్‌కు సైన్ ఇన్ చేయండి",

  "auth.signIn.idLabel": "ID లేదా ఇమెయిల్ చిరునామా",
  "auth.signIn.idPlaceholder": "CUS-06ISGGSQ లేదా name@example.com",
  "auth.signIn.password": "పాస్‌వర్డ్",
  "auth.signIn.busy": "సైన్ ఇన్ అవుతోంది…",
  "auth.signIn.failed": "మిమ్మల్ని సైన్ ఇన్ చేయలేకపోయాము. దయచేసి మళ్లీ ప్రయత్నించండి.",

  "auth.register.fullName": "పూర్తి పేరు",
  "auth.register.email": "ఇమెయిల్ చిరునామా",
  "auth.register.emailPlaceholder": "name@example.com",
  "auth.register.passwordLabel": "పాస్‌వర్డ్ (కనీసం {min} అక్షరాలు)",
  "auth.register.confirm": "పాస్‌వర్డ్‌ను నిర్ధారించండి",
  "auth.register.busy": "ఖాతా సృష్టిస్తోంది…",
  "auth.register.failed": "మీ ఖాతాను సృష్టించలేకపోయాము. దయచేసి మళ్లీ ప్రయత్నించండి.",

  "auth.validation.idOrEmail": "మీ ID లేదా సరైన ఇమెయిల్ చిరునామాను నమోదు చేయండి.",
  "auth.validation.password": "మీ పాస్‌వర్డ్‌ను నమోదు చేయండి.",
  "auth.validation.fullName": "మీ పూర్తి పేరును నమోదు చేయండి.",
  "auth.validation.email": "సరైన ఇమెయిల్ చిరునామాను నమోదు చేయండి.",
  "auth.validation.passwordMin": "కనీసం 8 అక్షరాలు ఉపయోగించండి.",
  "auth.validation.mismatch": "రెండు పాస్‌వర్డ్‌లు ఒకేలా లేవు.",

  "auth.signedIn.demoCustomer": "డెమో కస్టమర్‌గా సైన్ ఇన్ అయ్యారు",
  "auth.signedIn.demoAdvisor": "డెమో సలహాదారుగా సైన్ ఇన్ అయ్యారు",
  "auth.signedIn.demoAdmin": "డెమో అడ్మిన్‌గా సైన్ ఇన్ అయ్యారు",
  "auth.signedIn.plain": "సైన్ ఇన్ అయ్యారు",
  "auth.signedIn.openAdvisor": "సలహాదారు వర్క్‌స్పేస్ తెరవండి",

  "auth.demo.opening": "డెమో తెరుస్తోంది…",
  "auth.demo.customerButton": "డెమో కస్టమర్‌గా కొనసాగండి (కృత్రిమ)",
  "auth.demo.customerNote": "సైన్ అప్ అవసరం లేదు. డెమో కస్టమర్ కల్పిత డేటా మాత్రమే, నిజమైన వ్యక్తి కాదు.",
  "auth.demo.customerFailed": "డెమో కస్టమర్ ప్రస్తుతం అందుబాటులో లేరు.",
  "auth.demo.advisorLabel": "సలహాదారు వర్క్‌స్పేస్ (కృత్రిమ)",
  "auth.demo.advisorOpening": "తెరుస్తోంది…",
  "auth.demo.advisorButton": "సలహాదారుగా తెరవండి",
  "auth.demo.advisorFailed": "డెమో సలహాదారు ప్రస్తుతం అందుబాటులో లేరు.",

  "auth.signUp.opening": "రిజిస్ట్రేషన్ తెరుస్తోంది…",
};
export default messages;

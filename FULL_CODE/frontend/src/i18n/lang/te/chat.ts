import type { Messages } from "@/i18n/en";

/** "chat" messages in Telugu. */
const messages: Partial<Messages> = {
  "chat.day.today": "ఈ రోజు",
  "chat.day.yesterday": "నిన్న",
  "chat.with": "{name}తో చాట్",
  "chat.messages": "సందేశాలు",
  "chat.loadingMessages": "సందేశాలు లోడ్ అవుతున్నాయి…",
  "chat.noneSent": "ఎలాంటి సందేశాలు పంపలేదు.",
  "chat.start": "{name}తో సంభాషణ ప్రారంభించండి",
  "chat.newMessage": "కొత్త సందేశం",
  "chat.closed": "ఈ అపాయింట్‌మెంట్ రద్దు అయింది, కాబట్టి చాట్ మూసివేయబడింది.",
  "chat.messageTo": "{name}కు సందేశం",
  "chat.placeholder": "{name}కు సందేశం…",
  "chat.send": "సందేశం పంపండి",
  "chat.hint": "పంపడానికి Enter, కొత్త లైన్‌కు Shift+Enter",
  "chat.hintLeft": "పంపడానికి Enter, కొత్త లైన్‌కు Shift+Enter · {count} అక్షరాలు మిగిలాయి",
  "chat.error.load": "చాట్‌ను లోడ్ చేయలేకపోయాము.",
  "chat.error.send": "మీ సందేశం పంపబడలేదు. దయచేసి మళ్లీ ప్రయత్నించండి.",
};
export default messages;

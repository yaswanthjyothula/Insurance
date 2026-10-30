/** English text for the "chat" part of the customer site. Keys are "chat.something". The other languages translate these values. */
const chat = {
  "chat.day.today": "Today",
  "chat.day.yesterday": "Yesterday",
  "chat.with": "Chat with {name}",
  "chat.messages": "Messages",
  "chat.loadingMessages": "Loading messages…",
  "chat.noneSent": "No messages were sent.",
  "chat.start": "Start the conversation with {name}",
  "chat.newMessage": "New message",
  "chat.closed": "This appointment is cancelled, so the chat is closed.",
  "chat.messageTo": "Message {name}",
  "chat.placeholder": "Message {name}…",
  "chat.send": "Send message",
  "chat.hint": "Enter to send, Shift+Enter for a new line",
  "chat.hintLeft": "Enter to send, Shift+Enter for a new line · {count} characters left",
  "chat.error.load": "We couldn't load the chat.",
  "chat.error.send": "Your message wasn't sent. Please try again.",
} as const;

export default chat as Record<keyof typeof chat, string>;

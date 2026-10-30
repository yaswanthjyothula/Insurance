import type { Messages } from "@/i18n/en";
import account from "./account";
import advisory from "./advisory";
import assessment from "./assessment";
import auth from "./auth";
import chat from "./chat";
import common from "./common";
import home from "./home";
import layout from "./layout";
import results from "./results";

const messages: Partial<Messages> = {
  ...common,
  ...layout,
  ...home,
  ...auth,
  ...assessment,
  ...results,
  ...advisory,
  ...account,
  ...chat,
};
export default messages;

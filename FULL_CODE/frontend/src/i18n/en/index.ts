import account from "@/i18n/en/account";
import advisory from "@/i18n/en/advisory";
import assessment from "@/i18n/en/assessment";
import auth from "@/i18n/en/auth";
import chat from "@/i18n/en/chat";
import common from "@/i18n/en/common";
import home from "@/i18n/en/home";
import layout from "@/i18n/en/layout";
import products from "@/i18n/en/products";
import results from "@/i18n/en/results";

/** Every English message, in one flat object. This is the source: its keys define what each language must translate. */
export const en = { ...common, ...layout, ...home, ...auth, ...assessment, ...results, ...products, ...advisory, ...account, ...chat };
export type MessageKey = keyof typeof en & string;
export type Messages = Record<MessageKey, string>;

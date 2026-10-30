/** English text for the "auth" part of the customer site. Keys are "auth.something". The other languages translate these values. */
const auth = {
  "auth.session.checking": "Checking your session…",
  "auth.session.restoreFailed": "We couldn't restore your session.",

  "auth.panel.createTitle": "Create your account",
  "auth.panel.subtitle": "Save your plan and see your advisor appointments.",
  "auth.panel.tabsLabel": "Sign in or create an account",
  "auth.panel.tabCreate": "Create account",
  "auth.panel.or": "or",
  "auth.panel.advisorQuestion": "Are you an advisor?",
  "auth.panel.advisorLink": "Sign in to the advisor portal",

  "auth.signIn.idLabel": "ID or email address",
  "auth.signIn.idPlaceholder": "CUS-06ISGGSQ or name@example.com",
  "auth.signIn.password": "Password",
  "auth.signIn.busy": "Signing in…",
  "auth.signIn.failed": "We couldn't sign you in. Please try again.",

  "auth.register.fullName": "Full name",
  "auth.register.email": "Email address",
  "auth.register.emailPlaceholder": "name@example.com",
  "auth.register.passwordLabel": "Password (at least {min} characters)",
  "auth.register.confirm": "Confirm password",
  "auth.register.busy": "Creating account…",
  "auth.register.failed": "We couldn't create your account. Please try again.",

  "auth.validation.idOrEmail": "Enter your ID or a valid email address.",
  "auth.validation.password": "Enter your password.",
  "auth.validation.fullName": "Enter your full name.",
  "auth.validation.email": "Enter a valid email address.",
  "auth.validation.passwordMin": "Use at least 8 characters.",
  "auth.validation.mismatch": "The two passwords don't match.",

  "auth.signedIn.demoCustomer": "Signed in as the demo customer",
  "auth.signedIn.demoAdvisor": "Signed in as the demo advisor",
  "auth.signedIn.demoAdmin": "Signed in as the demo admin",
  "auth.signedIn.plain": "Signed in",
  "auth.signedIn.openAdvisor": "Open advisor workspace",

  "auth.demo.opening": "Opening demo…",
  "auth.demo.customerButton": "Continue as demo customer (synthetic)",
  "auth.demo.customerNote": "No sign-up needed. The demo customer is made-up data, not a real person.",
  "auth.demo.customerFailed": "The demo customer isn't available right now.",
  "auth.demo.advisorLabel": "Advisor workspace (synthetic)",
  "auth.demo.advisorOpening": "Opening…",
  "auth.demo.advisorButton": "Open as advisor",
  "auth.demo.advisorFailed": "The demo advisor isn't available right now.",

  "auth.signUp.opening": "Opening registration…",
} as const;

export default auth as Record<keyof typeof auth, string>;

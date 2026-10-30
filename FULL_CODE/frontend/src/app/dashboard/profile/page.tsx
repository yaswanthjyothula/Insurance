import { CustomerProfilePage } from "@/components/account/CustomerProfilePage";

// The page is only shown after sign-in, so Next cannot pre-render it for instant navigation
export const instant = false;

export default function ProfilePage() {
  return <CustomerProfilePage />;
}

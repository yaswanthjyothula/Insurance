import { CustomersPage } from "@/components/advisor/customers/CustomersPage";

// The page is only shown after sign-in, so Next cannot pre-render it for instant navigation
export const instant = false;

export default function AdvisorCustomersPage() {
  return <CustomersPage />;
}

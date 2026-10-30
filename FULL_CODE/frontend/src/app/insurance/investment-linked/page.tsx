import { CategoryGuidePage } from "@/components/insurance/CategoryGuide";
import { guides, categoryList } from "@/data/categories/guides";

const guide = guides["investment-linked"];

export const metadata = {
  title: `${guide.title} | LifeSure AI`,
  description: "ULIPs explained: how charges, fund choice, lock-in and tax work, and who they suit.",
};

export default function Page() {
  const others = categoryList.filter((c) => c.key !== guide.key).map((c) => ({ key: c.key, href: c.href, shortTitle: c.shortTitle }));
  return <CategoryGuidePage guide={guide} others={others} />;
}

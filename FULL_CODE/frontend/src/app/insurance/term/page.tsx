import { CategoryGuidePage } from "@/components/insurance/CategoryGuide";
import { guides, categoryList } from "@/data/categories/guides";

const guide = guides["term"];

export const metadata = {
  title: `${guide.title} | LifeSure AI`,
  description: "Term insurance explained, with real plans from eight insurers, claims records and what to check before you buy.",
};

export default function Page() {
  const others = categoryList.filter((c) => c.key !== guide.key).map((c) => ({ key: c.key, href: c.href, shortTitle: c.shortTitle }));
  return <CategoryGuidePage guide={guide} others={others} />;
}

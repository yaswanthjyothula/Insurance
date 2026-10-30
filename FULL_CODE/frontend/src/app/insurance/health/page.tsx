import { CategoryGuidePage } from "@/components/insurance/CategoryGuide";
import { guides, categoryList } from "@/data/categories/guides";

const guide = guides["health"];

export const metadata = {
  title: `${guide.title} | LifeSure AI`,
  description: "Health insurance explained: cashless cover, waiting periods, room rent limits and how to choose a sum insured.",
};

export default function Page() {
  const others = categoryList.filter((c) => c.key !== guide.key).map((c) => ({ key: c.key, href: c.href, shortTitle: c.shortTitle }));
  return <CategoryGuidePage guide={guide} others={others} />;
}

import { CategoryGuidePage } from "@/components/insurance/CategoryGuide";
import { guides, categoryList } from "@/data/categories/guides";

const guide = guides["other"];

export const metadata = {
  title: `${guide.title} | LifeSure AI`,
  description: "Cyber and personal accident cover explained: what is covered, what is excluded and how to claim.",
};

export default function Page() {
  const others = categoryList.filter((c) => c.key !== guide.key).map((c) => ({ key: c.key, href: c.href, shortTitle: c.shortTitle }));
  return <CategoryGuidePage guide={guide} others={others} />;
}

import { CategoryGuidePage } from "@/components/insurance/CategoryGuide";
import { guides, categoryList } from "@/data/categories/guides";

const guide = guides["general"];

export const metadata = {
  title: `${guide.title} | LifeSure AI`,
  description: "Home, motor and travel insurance explained, with what is covered, what is excluded and how to avoid underinsuring.",
};

export default function Page() {
  const others = categoryList.filter((c) => c.key !== guide.key).map((c) => ({ key: c.key, href: c.href, shortTitle: c.shortTitle }));
  return <CategoryGuidePage guide={guide} others={others} />;
}

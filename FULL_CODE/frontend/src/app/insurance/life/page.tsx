import { CategoryGuidePage } from "@/components/insurance/CategoryGuide";
import { guides, categoryList } from "@/data/categories/guides";

const guide = guides["life"];

export const metadata = {
  title: `${guide.title} | LifeSure AI`,
  description: "Traditional life insurance explained: endowment, money-back and whole life, what is guaranteed, and what to ask first.",
};

export default function Page() {
  const others = categoryList.filter((c) => c.key !== guide.key).map((c) => ({ key: c.key, href: c.href, shortTitle: c.shortTitle }));
  return <CategoryGuidePage guide={guide} others={others} />;
}

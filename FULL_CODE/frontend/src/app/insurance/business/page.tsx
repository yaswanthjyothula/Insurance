import { CategoryGuidePage } from "@/components/insurance/CategoryGuide";
import { guides, categoryList } from "@/data/categories/guides";

const guide = guides["business"];

export const metadata = {
  title: `${guide.title} | LifeSure AI`,
  description: "Business insurance explained: keyman cover, group term and directors and officers liability.",
};

export default function Page() {
  const others = categoryList.filter((c) => c.key !== guide.key).map((c) => ({ key: c.key, href: c.href, shortTitle: c.shortTitle }));
  return <CategoryGuidePage guide={guide} others={others} />;
}

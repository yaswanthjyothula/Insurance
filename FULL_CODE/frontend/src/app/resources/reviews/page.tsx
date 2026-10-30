import { SOURCES } from "@/data/resources";
import { Callout, ResourcePage, SourceLinks } from "@/components/resources/parts";

export const metadata = { title: "Reviews | LifeSure AI", description: "How to judge an insurer from real data." };

const WAYS = [
  {
    title: "Look at claims data, not ratings",
    body: "Check the claim settlement ratio for several years, and whether it is by number or by amount. See the insurer directory for the figures we have, each with its source.",
  },
  { title: "Check solvency", body: "IRDAI's minimum is 1.5 times. The higher the ratio, the bigger the buffer." },
  {
    title: "Read the grievance record",
    body: "IRDAI's Bima Bharosa portal is where complaints are registered. Insurers must resolve a complaint in 14 days.",
  },
  {
    title: "Read the policy document",
    body: "Exclusions, waiting periods and the claim process are all in the wording. You have 30 days to return a policy after receiving it.",
  },
];

export default function ReviewsPage() {
  return (
    <ResourcePage
      eyebrow="Reviews"
      title="No reviews here yet, by design"
      intro="We have not collected verified customer reviews, and we will not show invented ones. Here is how to judge an insurer from real, public data."
      narrow
    >
      <div className="space-y-4">
        {WAYS.map((w) => (
          <div key={w.title} className="rounded-2xl bg-white border border-[#D9D3E8] p-5">
            <h2 className="text-lg font-bold text-[#24212B]">{w.title}</h2>
            <p className="mt-1 text-[15px] leading-7 text-[#4A4658]">{w.body}</p>
          </div>
        ))}
      </div>
      <div className="mt-6 space-y-4">
        <Callout>When we have real customer feedback from verified users, with their consent, it will go here.</Callout>
        <SourceLinks sources={[SOURCES.bima, SOURCES.ppi]} />
      </div>
    </ResourcePage>
  );
}

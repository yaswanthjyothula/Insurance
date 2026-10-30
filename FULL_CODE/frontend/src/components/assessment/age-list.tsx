import { useI18n } from "@/i18n/I18nProvider";
import { Field, TextInput } from "./fields";

interface AgeListProps {
  /** Form key, also the prefix of the per-person error keys ("childAges.0"). */
  name: "childAges" | "parentAges";
  ages: string[];
  noun: "child" | "parent";
  onChange: (ages: string[]) => void;
  errorFor: (key: string) => string | undefined;
}

/** One age box per person; the list length follows the count the visitor typed. */
export function AgeList({ name, ages, noun, onChange, errorFor }: AgeListProps) {
  const { t } = useI18n();
  if (ages.length === 0) return null;
  const setAge = (index: number, age: string) => onChange(ages.map((current, i) => (i === index ? age : current)));
  return (
    <>
      {ages.map((age, index) => {
        const id = `${name}-${index}`;
        const error = errorFor(`${name}.${index}`);
        return (
          <Field
            key={id}
            id={id}
            label={t(noun === "child" ? "assessment.ages.childLabel" : "assessment.ages.parentLabel", { number: index + 1 })}
            error={error}
          >
            <TextInput
              id={id}
              value={age}
              onChange={(value) => setAge(index, value)}
              placeholder={t("assessment.ages.placeholder")}
              suffix={t("assessment.unit.years")}
              error={error}
              maxDigits={3}
            />
          </Field>
        );
      })}
    </>
  );
}

import { ResumeFormErrors } from "@/controller/formState";
import { Education } from "@/controller/types";
import { Button } from "@/components/Button";
import {
  InputListControls,
  useKeyList,
} from "component-library/components/Form/inputs/List";
import { FieldWrapper } from "component-library/components/Form";
import { TextInput } from "component-library/components/Form/inputs/Text";

export function EducationListInput({
  name,
  id,
  defaultValue,
  label,
}: {
  name: string;
  id: string;
  label: string;
  defaultValue?: Education[];
  placeholder?: string;
  errors?: ResumeFormErrors | undefined;
}) {
  const [{ values }, dispatch] = useKeyList<Education>(defaultValue);
  return (
    <FieldWrapper label={label} id={id}>
      <ul>
        {values.map(({ key, defaultValue }, index) => {
          const currentItemName = `${name}[${index}]`;
          return (
            <li key={key} className="flex flex-col my-1">
              <div>
                <TextInput
                  label="School"
                  name={`${currentItemName}.school`}
                  defaultValue={defaultValue?.school}
                />
                <TextInput
                  label="Achievement"
                  name={`${currentItemName}.achievement`}
                  defaultValue={defaultValue?.achievement}
                />
                <TextInput
                  label="Start Date"
                  name={`${currentItemName}.startDate`}
                  defaultValue={defaultValue?.startDate}
                />
                <TextInput
                  label="End Date"
                  name={`${currentItemName}.endDate`}
                  defaultValue={defaultValue?.endDate}
                />
              </div>
              <div>
                <InputListControls dispatch={dispatch} index={index} />
              </div>
            </li>
          );
        })}
      </ul>
      <Button
        onClick={() => {
          dispatch({ type: "APPEND" });
        }}
      >
        Append Item
      </Button>
    </FieldWrapper>
  );
}

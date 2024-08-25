import { ResumeFormErrors } from "@/controller/formState";
import { Education } from "@/controller/types";
import { Button } from "@/components/Button";
import {
  FieldWrapper,
  InputListControls,
  TextInput,
  useKeyList,
} from "@/components/Form";

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
  const [{ keys, defaultValues }, dispatch] =
    useKeyList<Education>(defaultValue);
  return (
    <FieldWrapper label={label} id={id}>
      <ul>
        {keys.map((key, index) => {
          const itemKey = `${name}[${index}]`;
          const currentDefaultItem = defaultValues?.[index];
          return (
            <li key={key} className="flex flex-col my-1">
              <div>
                <TextInput
                  label="School"
                  name={`${itemKey}.school`}
                  defaultValue={currentDefaultItem?.school}
                />
                <TextInput
                  label="Achievement"
                  name={`${itemKey}.achievement`}
                  defaultValue={currentDefaultItem?.achievement}
                />
                <TextInput
                  label="Start Date"
                  name={`${itemKey}.startDate`}
                  defaultValue={currentDefaultItem?.startDate}
                />
                <TextInput
                  label="End Date"
                  name={`${itemKey}.endDate`}
                  defaultValue={currentDefaultItem?.endDate}
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

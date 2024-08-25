import { ResumeFormErrors } from "@/controller/formState";
import { Experience } from "@/controller/types";
import { Button } from "@/components/Button";
import {
  FieldWrapper,
  InputListControls,
  TextAreaInput,
  TextInput,
  useKeyList,
} from "@/components/Form";

export function ExperienceListInput({
  name,
  id,
  defaultValue,
  label,
}: {
  name: string;
  id: string;
  label: string;
  defaultValue?: Experience[];
  placeholder?: string;
  errors?: ResumeFormErrors | undefined;
}) {
  const [{ keys, defaultValues }, dispatch] =
    useKeyList<Experience>(defaultValue);
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
                  label="Company"
                  name={`${itemKey}.company`}
                  defaultValue={currentDefaultItem?.company}
                />
                <TextInput
                  label="Title"
                  name={`${itemKey}.title`}
                  defaultValue={currentDefaultItem?.title}
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
                <TextAreaInput
                  label="Description"
                  name={`${itemKey}.description`}
                  defaultValue={currentDefaultItem?.description}
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

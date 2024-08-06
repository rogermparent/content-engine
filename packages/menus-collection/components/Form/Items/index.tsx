import { MenuItem } from "../../../controller/types";
import { Button } from "component-library/components/Button";
import { FieldWrapper } from "component-library/components/Form";
import {
  InputListControls,
  KeyListAction,
  useKeyList,
} from "component-library/components/Form/inputs/List";
import { TextInput } from "component-library/components/Form/inputs/Text";
import { Dispatch } from "react";
import { MenuFormErrors } from "../../../controller/formState";

function ItemInput({
  index,
  dispatch,
}: {
  currentDefaultItem?: MenuItem;
  itemKey: string;
  index: number;
  dispatch: Dispatch<KeyListAction>;
}) {
  return (
    <div>
      <div className="flex flex-row flex-nowrap justify-center">
        <InputListControls dispatch={dispatch} index={index} />
      </div>
    </div>
  );
}

function MenuItemFields({
  currentDefaultItem,
  itemKey,
  index,
  dispatch,
}: {
  currentDefaultItem?: MenuItem;
  itemKey: string;
  index: number;
  dispatch: Dispatch<KeyListAction>;
}) {
  const [{ values }, childDispatch] = useKeyList<MenuItem>(
    currentDefaultItem?.children,
  );
  return (
    <div>
      <TextInput
        label="Name"
        name={`${itemKey}.name`}
        defaultValue={currentDefaultItem?.name}
      />
      <TextInput
        label="Href"
        name={`${itemKey}.href`}
        defaultValue={currentDefaultItem?.href}
      />
      <FieldWrapper label="Children">
        <div className="pl-2 ml-0.5 border-l-2 border-white">
          <ul>
            {values.map(({ key, defaultValue }, index) => {
              const childItemKey = `${itemKey}.children[${index}]`;
              return (
                <li key={key}>
                  <ItemInput
                    currentDefaultItem={defaultValue as MenuItem}
                    itemKey={childItemKey}
                    index={index}
                    dispatch={childDispatch}
                  />
                </li>
              );
            })}
          </ul>
          <Button
            className="mx-0.5 my-1 w-full"
            onClick={() => {
              childDispatch({ type: "APPEND" });
            }}
          >
            Append
          </Button>
        </div>
      </FieldWrapper>
      <div className="flex flex-row flex-nowrap justify-center">
        <InputListControls dispatch={dispatch} index={index} />
      </div>
    </div>
  );
}

function MenuItemInput({
  defaultValue,
  itemKey,
  index,
  dispatch,
}: {
  defaultValue?: MenuItem;
  itemKey: string;
  index: number;
  dispatch: Dispatch<KeyListAction>;
}) {
  return (
    <li className="flex flex-col my-1">
      <MenuItemFields
        currentDefaultItem={defaultValue as MenuItem}
        itemKey={itemKey}
        dispatch={dispatch}
        index={index}
      />
    </li>
  );
}

export function ItemsListInput({
  name,
  id,
  defaultValue,
  label,
}: {
  name: string;
  id: string;
  label: string;
  defaultValue?: MenuItem[];
  placeholder?: string;
  errors?: MenuFormErrors | undefined;
}) {
  const [{ values }, dispatch] = useKeyList<MenuItem>(defaultValue);
  return (
    <FieldWrapper label={label} id={id}>
      <ul>
        {values.map(({ key, defaultValue }, index) => {
          const itemKey = `${name}[${index}]`;
          return (
            <MenuItemInput
              key={key}
              defaultValue={defaultValue}
              itemKey={itemKey}
              index={index}
              dispatch={dispatch}
            />
          );
        })}
      </ul>
      <Button
        className="mx-0.5 my-1 w-full"
        onClick={() => {
          dispatch({ type: "APPEND" });
        }}
      >
        Append
      </Button>
    </FieldWrapper>
  );
}

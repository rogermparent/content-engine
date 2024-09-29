"use client";

import { useActionState } from "react";
import { SubmitButton } from "component-library/components/SubmitButton";
import { remoteCommandAction } from "./actions";
import { RemoteWithoutRefs } from "simple-git";

export function RemoteSelector({ remotes }: { remotes: RemoteWithoutRefs[] }) {
  const [remoteCommandState, remoteCommandActionWithState] = useActionState(
    remoteCommandAction,
    null,
  );
  return (
    <form action={remoteCommandActionWithState}>
      {remoteCommandState && (
        <div className="text-sm py-1 text-red-300 whitespace-pre">
          {remoteCommandState}
        </div>
      )}
      <ul className="pl-1 my-3">
        {remotes.map(({ name }) => {
          return (
            <li key={name}>
              <label className="p-1">
                <input name="remote" value={name} type="radio" /> {name}
              </label>
            </li>
          );
        })}
      </ul>
      <div className="flex flex-row gap-1">
        <SubmitButton
          overrideDefaultStyles={true}
          className="border border-white rounded px-2 py-1"
          name="command"
          value="pull"
        >
          Pull
        </SubmitButton>
        <SubmitButton
          overrideDefaultStyles={true}
          className="border border-white rounded px-2 py-1"
          name="command"
          value="push"
        >
          Push
        </SubmitButton>
      </div>
    </form>
  );
}

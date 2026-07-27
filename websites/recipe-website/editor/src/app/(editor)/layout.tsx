import { ReactNode } from "react";
import { SettingsShell } from "./SettingsShell";

export default function EditorLayout({ children }: { children: ReactNode }) {
  return <SettingsShell>{children}</SettingsShell>;
}

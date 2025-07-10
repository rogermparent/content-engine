import {
  BranchSummaryBranch,
  DefaultLogFields,
  ListLogLine,
  RemoteWithRefs,
} from "simple-git";

export type EntryWithDiff = DefaultLogFields & ListLogLine & { diff: string };

export interface GitInfo {
  branches: BranchSummaryBranch[];
  remotes: RemoteWithRefs[];
  entriesWithDiffs: EntryWithDiff[];
}

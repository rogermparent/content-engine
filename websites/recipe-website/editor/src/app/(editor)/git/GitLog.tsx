"use client";

import React, { useState } from "react";
import { EntryWithDiff } from "./types";

interface GitLogProps {
  log: EntryWithDiff[];
}

const GitLogItem = ({ entry }: { entry: EntryWithDiff }) => {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <div onClick={() => setOpen(!open)} className="my-1 font-lg font-bold">
        {entry.message}
      </div>
      {open && (
        <div>
          <div className="font-bold my-1">Commit Details</div>
          <ul className="text-sm">
            <li>
              <strong>Author</strong>: <span>{entry.author_name}</span>
            </li>
            <li>
              <strong>Date</strong>: <span>{entry.date}</span>
            </li>
            <li>
              <strong>Diff</strong>: <pre>{entry.diff}</pre>
            </li>
          </ul>
          <div>
            <button
              onClick={() => {
                setOpen(false);
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export const GitLog: React.FC<GitLogProps> = ({ log }) => {
  return (
    <ul className="border-t border-gray-300">
      {log && log.length > 0
        ? log.map((entry) => (
            <li key={entry.hash} className="border-b border-gray-300 py-1">
              <GitLogItem entry={entry} />
            </li>
          ))
        : "No commits yet"}
    </ul>
  );
};

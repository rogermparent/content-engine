import React from "react";

interface LogEntry {
  hash: string;
  date: string;
  message: string;
  author_name: string;
}

interface GitLogProps {
  log: LogEntry[];
}

export const GitLog: React.FC<GitLogProps> = ({ log }) => {
  return (
    <ul>
      {log.map((entry) => (
        <li key={entry.hash} className="border-b border-gray-300 py-2">
          <div>
            <strong>{entry.message}</strong>
          </div>
          <div className="text-sm text-gray-500">
            {entry.author_name} - {entry.date}
          </div>
        </li>
      ))}
    </ul>
  );
};

import { ReactNode } from "react";
import { Search } from "lucide-react";

interface Props {
  search: string;
  onSearch: (value: string) => void;
  placeholder: string;
  // A longer hint on what the search matches, shown on hover
  title?: string;
  // What can be done to the list, each opening its modal
  children?: ReactNode;
}

/**
 * The one line above a list, in both applications: its search first, then its actions.
 * Nothing is typed inline above the search: creating something opens a modal.
 */
export default function ListToolbar({ search, onSearch, placeholder, title, children }: Props) {
  return (
    <div data-list-toolbar className="flex flex-wrap items-center gap-2 mt-2">
      <div className="relative flex-1 min-w-48">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          title={title}
          className="w-full h-10 pl-9 pr-4 border rounded-md focus:outline-hidden focus:ring-2 focus:ring-blue-500"
        />
      </div>
      {children}
    </div>
  );
}

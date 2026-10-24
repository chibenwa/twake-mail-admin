import { forwardRef, InputHTMLAttributes, KeyboardEvent, useId, useState } from "react";
import { useUserSuggestions } from "@/hooks/use-user-suggestions";
import { cn } from "@/lib/utils";

// The look of the Input component, for the fields that had it
export const SUGGEST_INPUT_CLASS =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm";

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
  value: string;
  onValueChange: (value: string) => void;
  // Sizing of the field in its row (flex-1, basis…): the suggestions are anchored to it
  wrapperClassName?: string;
}

/**
 * A field expecting a user of the server: the admin types freely, and up to five matching
 * users are offered under it (arrows and Enter, or a click). Nothing is enforced: an address
 * that is not offered can still be typed and submitted.
 */
const UserSuggestInput = forwardRef<HTMLInputElement, Props>(
  ({ value, onValueChange, wrapperClassName, onKeyDown, onBlur, onFocus, className, ...props }, ref) => {
    const listId = useId();
    const [open, setOpen] = useState(false);
    const [active, setActive] = useState(-1);
    const suggestions = useUserSuggestions(value, open).filter((s) => s.toLowerCase() !== value.trim().toLowerCase());
    const shown = open && suggestions.length > 0;

    const pick = (username: string) => {
      onValueChange(username);
      setOpen(false);
      setActive(-1);
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
      if (shown && event.key === "ArrowDown") {
        event.preventDefault();
        setActive((i) => (i + 1) % suggestions.length);
        return;
      }
      if (shown && event.key === "ArrowUp") {
        event.preventDefault();
        setActive((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
        return;
      }
      // Enter picks the highlighted suggestion, instead of adding or submitting
      if (shown && active >= 0 && event.key === "Enter") {
        event.preventDefault();
        event.stopPropagation();
        pick(suggestions[active]);
        return;
      }
      if (shown && event.key === "Escape") {
        // Closes the suggestions only, not the dialog around the field
        event.stopPropagation();
        setOpen(false);
        return;
      }
      onKeyDown?.(event);
    };

    return (
      <div className={cn("relative", wrapperClassName)}>
        <input
          ref={ref}
          {...props}
          value={value}
          onChange={(e) => { onValueChange(e.target.value); setOpen(true); setActive(-1); }}
          onFocus={(e) => { setOpen(true); onFocus?.(e); }}
          onBlur={(e) => { setOpen(false); onBlur?.(e); }}
          onKeyDown={handleKeyDown}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={shown}
          aria-controls={shown ? listId : undefined}
          aria-activedescendant={shown && active >= 0 ? `${listId}-${active}` : undefined}
          autoComplete="off"
          className={className}
        />
        {shown && (
          <ul
            id={listId}
            role="listbox"
            className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-auto rounded-md border bg-background py-1 text-sm shadow-md"
          >
            {suggestions.map((username, index) => (
              <li
                key={username}
                id={`${listId}-${index}`}
                role="option"
                aria-selected={index === active}
                // Before the blur of the field, which would close the list first
                onMouseDown={(e) => { e.preventDefault(); pick(username); }}
                onMouseEnter={() => setActive(index)}
                className={cn("px-3 py-1.5 cursor-pointer break-all", index === active && "bg-gray-100")}
              >
                {username}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }
);
UserSuggestInput.displayName = "UserSuggestInput";

export default UserSuggestInput;

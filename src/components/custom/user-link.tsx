import { Link } from "react-router";
import { cn } from "@/lib/utils";
import { useManagedDomains } from "@/hooks/use-managed-domains";

const domainOf = (address: string) => address.slice(address.lastIndexOf("@") + 1).toLowerCase();

interface Props {
  address: string;
  // An account listed by the server (Users list, quota reports): linked without checking its domain
  known?: boolean;
  className?: string;
}

/**
 * An address shown in the console, linked to its user page when it is local: its domain is
 * one the server manages. External addresses (someone@gmail.com) stay plain text. Every user
 * link of the console looks and behaves the same.
 */
export default function UserLink({ address, known = false, className }: Props) {
  const managed = useManagedDomains();
  const isLocal = known || (address.includes("@") && (managed === null || managed.has(domainOf(address))));
  if (!isLocal) return <span className={cn("break-all", className)}>{address}</span>;
  return (
    <Link to={`/users/user/${encodeURIComponent(address)}`} className={cn("text-blue-600 hover:underline break-all", className)}>
      {address}
    </Link>
  );
}

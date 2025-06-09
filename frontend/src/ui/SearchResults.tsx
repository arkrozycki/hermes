export function SearchResults({ query }: { query: string }) {
  return (
    <div className="p-4">
      <p className="text-sm text-muted-foreground ">
        Showing results for: <strong>{query}</strong>
      </p>
      <ul className="space-y-2">
        {[1, 2, 3].map((i) => (
          <li
            key={i}
            className="p-2 rounded-md bg-muted hover:bg-accent cursor-pointer"
          >
            Result #{i} for <em>{query}</em>
          </li>
        ))}
      </ul>
    </div>
  );
}

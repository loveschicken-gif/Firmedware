import { Badge } from "@/components/ui/badge";

export function TagList({
  tags,
}: {
  tags: { tag: { id: string; name: string; color: string | null } }[];
}) {
  if (tags.length === 0) return <span className="text-slate-400">—</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {tags.map(({ tag }) => (
        <Badge
          key={tag.id}
          variant="secondary"
          style={tag.color ? { backgroundColor: `${tag.color}20`, color: tag.color } : undefined}
        >
          {tag.name}
        </Badge>
      ))}
    </div>
  );
}

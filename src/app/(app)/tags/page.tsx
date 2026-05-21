import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { createTagAction } from "@/lib/actions/tags";
import { prisma } from "@/lib/prisma";
import { tagWhereActive } from "@/lib/rbac";
import { requireAdmin } from "@/lib/session";
import { getServerNamespaceI18n } from "@/lib/i18n/server";
import { TagCreateForm } from "./tag-create-form";

export default async function TagsPage() {
  const admin = await requireAdmin();
  const { tn } = await getServerNamespaceI18n("admin", admin.id);
  const tags = await prisma.tag.findMany({
    where: tagWhereActive(),
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <PageHeader
        title={tn("tags.title")}
        description={tn("tags.description")}
      />
      <div className="mb-8 max-w-md">
        <TagCreateForm action={createTagAction} />
      </div>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <Badge
            key={tag.id}
            variant="secondary"
            style={
              tag.color
                ? { backgroundColor: `${tag.color}20`, color: tag.color }
                : undefined
            }
          >
            {tag.name}
          </Badge>
        ))}
      </div>
    </div>
  );
}

import { Card, CardContent } from "@/components/ui/card";

export function CommentsPlaceholder({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Card className="border-dashed border-amber-200 bg-amber-50/50">
      <CardContent className="pt-6">
        <h3 className="text-sm font-medium text-slate-900">{title}</h3>
        <p className="mt-2 text-sm text-slate-600">{description}</p>
      </CardContent>
    </Card>
  );
}

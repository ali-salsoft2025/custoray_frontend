import Link from "next/link"
import { IconArrowLeft } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

type PosPlaceholderPageProps = {
  title: string
  description: string
}

export function PosPlaceholderPage({ title, description }: PosPlaceholderPageProps) {
  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4 py-8">
      <Button variant="outline" size="sm" className="w-fit" asChild>
        <Link href="/pos">
          <IconArrowLeft className="size-4" />
          POS dashboard
        </Link>
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm">
          This screen is coming soon. Products for POS are managed under{" "}
          <Link href="/inventory/products" className="text-primary font-medium hover:underline">
            Inventory → Products
          </Link>
          .
        </CardContent>
      </Card>
    </div>
  )
}

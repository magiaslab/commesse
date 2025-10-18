import { TrendingDownIcon, TrendingUpIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export function SectionCards({
  cards,
}: {
  cards?: {
    revenue?: { label?: string; subtitle?: string; value?: string | number; delta?: string }
    customers?: { label?: string; subtitle?: string; value?: string | number; delta?: string }
    accounts?: { label?: string; subtitle?: string; value?: string | number; delta?: string }
    growth?: { label?: string; subtitle?: string; value?: string | number; delta?: string }
  }
} = {}) {
  return (
    <div className="*:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4 grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card lg:px-6">
      <Card className="@container/card">
        <CardHeader className="relative">
          <CardDescription>{cards?.revenue?.label ?? 'Commesse attive'}</CardDescription>
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
            {cards?.revenue?.value ?? '-'}
          </CardTitle>
          <div className="absolute right-4 top-4">
            <Badge variant="secondary" className="flex gap-1 rounded-lg text-xs">
              <TrendingUpIcon className="size-3" />
              {cards?.revenue?.delta ?? ''}
            </Badge>
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          {cards?.revenue?.subtitle ? (
            <div className="text-muted-foreground">{cards.revenue.subtitle}</div>
          ) : null}
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader className="relative">
          <CardDescription>{cards?.customers?.label ?? 'Scadenze (7 gg)'}</CardDescription>
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
            {cards?.customers?.value ?? '-'}
          </CardTitle>
          <div className="absolute right-4 top-4">
            <Badge variant="secondary" className="flex gap-1 rounded-lg text-xs">
              <TrendingDownIcon className="size-3" />
              {cards?.customers?.delta ?? ''}
            </Badge>
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          {cards?.customers?.subtitle ? (
            <div className="text-muted-foreground">{cards.customers.subtitle}</div>
          ) : null}
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader className="relative">
          <CardDescription>{cards?.accounts?.label ?? 'Fatture da pagare'}</CardDescription>
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
            {cards?.accounts?.value ?? '-'}
          </CardTitle>
          <div className="absolute right-4 top-4">
            <Badge variant="secondary" className="flex gap-1 rounded-lg text-xs">
              <TrendingUpIcon className="size-3" />
              {cards?.accounts?.delta ?? ''}
            </Badge>
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          {cards?.accounts?.subtitle ? (
            <div className="text-muted-foreground">{cards.accounts.subtitle}</div>
          ) : null}
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader className="relative">
          <CardDescription>{cards?.growth?.label ?? 'Documenti da validare'}</CardDescription>
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
            {cards?.growth?.value ?? '-'}
          </CardTitle>
          <div className="absolute right-4 top-4">
            <Badge variant="secondary" className="flex gap-1 rounded-lg text-xs">
              <TrendingUpIcon className="size-3" />
              {cards?.growth?.delta ?? ''}
            </Badge>
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          {cards?.growth?.subtitle ? (
            <div className="text-muted-foreground">{cards.growth.subtitle}</div>
          ) : null}
        </CardFooter>
      </Card>
    </div>
  )
}

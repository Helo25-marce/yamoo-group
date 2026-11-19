import { CATEGORY_TARGETS } from "./filters"
import { formatFcfa } from "./format"
import { calculateDrivePrice } from "./pricing"
import { vehicleQuote, type DriveSearchCriteria } from "./search"
import type { DrivePartner, DriveVehicle } from "./types"
import type { Locale } from "../i18n/messages"

/** Translatable message. The UI resolves `key` with i18next, so FR and EN share one rule set. */
export type Msg = { key: string; values?: Record<string, string | number> }

export const COMPARE_TOPICS = [
  "cost",
  "features",
  "capacity",
  "fuel",
  "transmission",
  "mileage",
  "pickup",
  "insurance",
  "deposit",
  "fuelpolicy",
  "cancellation",
  "extras",
  "providers",
  "reviews",
] as const

export type CompareTopic = (typeof COMPARE_TOPICS)[number]

/** null = not published for that vehicle. Never filled with a guess. */
export type CompareRow = { label: Msg; cells: Array<Msg | null> }

export type CompareAnswer = { topic: CompareTopic; rows: CompareRow[]; insights: Msg[] }

export type CompareContext = {
  criteria: DriveSearchCriteria | null
  partners: readonly DrivePartner[]
  locale: Locale
}

/**
 * Pluggable assistant. The demo ships the deterministic engine only.
 * A model-backed assistant must run server-side: no API key in the frontend.
 */
export interface CompareAssistant {
  readonly kind: "deterministic" | "model"
  answer(topic: CompareTopic, vehicles: readonly DriveVehicle[], context: CompareContext): CompareAnswer | Promise<CompareAnswer>
}

const raw = (text: string): Msg => ({ key: "drive.sc.raw", values: { text } })
const msg = (key: string, values?: Msg["values"]): Msg => ({ key, values })

export function targetCategory(vehicle: DriveVehicle): string {
  return CATEGORY_TARGETS.find((target) => target.from.includes(vehicle.category))?.id ?? vehicle.category
}

export function availableTopics(vehicles: readonly DriveVehicle[]): CompareTopic[] {
  const reviewed = vehicles.some((vehicle) => vehicle.rating?.verified && vehicle.rating.count > 0)
  return COMPARE_TOPICS.filter((topic) => topic !== "reviews" || reviewed)
}

/** Total for the current search, using only the configured pricing rule. */
export function quoteFor(vehicle: DriveVehicle, criteria: DriveSearchCriteria | null): number | null {
  if (!criteria) return null
  return vehicleQuote(criteria, vehicle).priceFcfa
}

function missingInsights(rows: CompareRow[], vehicles: readonly DriveVehicle[]): Msg[] {
  const out: Msg[] = []
  for (const row of rows) {
    const gaps = row.cells.map((cell, index) => (cell ? null : vehicles[index].name)).filter((name): name is string => Boolean(name))
    if (gaps.length === 0) continue
    if (gaps.length === vehicles.length) out.push(msg("drive.sc.i.noneHas", { label: `$t(${row.label.key})` }))
    else out.push(msg("drive.sc.i.someMissing", { label: `$t(${row.label.key})`, names: gaps.join(", ") }))
  }
  return out
}

function compareNumber(vehicles: readonly DriveVehicle[], pick: (vehicle: DriveVehicle) => number, key: string): Msg | null {
  const sorted = [...vehicles].sort((left, right) => pick(right) - pick(left))
  const top = sorted[0]
  const low = sorted[sorted.length - 1]
  if (pick(top) === pick(low)) return msg(`${key}Same`, { count: pick(top) })
  return msg(key, { top: top.name, low: low.name, a: pick(top), b: pick(low) })
}

function textCell(value: string | undefined): Msg | null {
  return value && value.trim() ? raw(value.trim()) : null
}

function featureCell(vehicle: DriveVehicle): Msg | null {
  const features = vehicle.specs?.features
  if (!features || features.length === 0) return null
  return msg("drive.sc.v.list", { items: features.map((item) => `$t(drive.f.opt.features.${item})`).join(", ") })
}

function build(topic: CompareTopic, vehicles: readonly DriveVehicle[], context: CompareContext): CompareAnswer {
  const money = (amount: number) => formatFcfa(amount, context.locale)
  const offer = (vehicle: DriveVehicle) => vehicle.selfDrive
  const insights: Msg[] = []
  let rows: CompareRow[] = []

  switch (topic) {
    case "cost": {
      const quotes = vehicles.map((vehicle) => quoteFor(vehicle, context.criteria))
      rows = [
        {
          label: msg("drive.sc.r.total"),
          cells: quotes.map((quote) => (quote === null ? null : msg("drive.sc.v.amount", { amount: money(quote) }))),
        },
        {
          label: msg("drive.sc.r.selfDriveRate"),
          cells: vehicles.map((vehicle) => {
            const rate = offer(vehicle)?.dailyRateFcfa
            return typeof rate === "number" ? msg("drive.sc.v.perDay", { amount: money(rate) }) : null
          }),
        },
      ]
      if (context.criteria) {
        insights.push(msg("drive.sc.i.costRule"))
        const priced = vehicles.map((vehicle, index) => ({ vehicle, quote: quotes[index]! })).sort((left, right) => left.quote - right.quote)
        const cheapest = priced[0]
        const dearest = priced[priced.length - 1]
        if (cheapest.quote === dearest.quote) insights.push(msg("drive.sc.i.costSame", { amount: money(cheapest.quote) }))
        else insights.push(msg("drive.sc.i.costCheapest", { name: cheapest.vehicle.name, amount: money(cheapest.quote), other: dearest.vehicle.name, diff: money(dearest.quote - cheapest.quote) }))
        rows.splice(1, 0, {
          label: msg("drive.sc.r.days"),
          cells: vehicles.map((vehicle) => msg("drive.sc.v.days", { count: vehicleQuote(context.criteria!, vehicle).days })),
        })
      } else {
        insights.push(msg("drive.sc.i.costNeedDates"))
      }
      break
    }
    case "features":
    case "capacity": {
      rows = [
        ...(topic === "features" ? [{ label: msg("drive.sc.r.category"), cells: vehicles.map((vehicle) => msg(`drive.f.opt.category.${targetCategory(vehicle)}`)) }] : []),
        { label: msg("drive.sc.r.seats"), cells: vehicles.map((vehicle) => msg("drive.sc.v.seats", { count: vehicle.seats })) },
        { label: msg("drive.sc.r.luggage"), cells: vehicles.map((vehicle) => msg("drive.sc.v.bags", { count: vehicle.luggage })) },
        ...(topic === "features"
          ? [
              { label: msg("drive.sc.r.transmission"), cells: vehicles.map((vehicle) => (vehicle.specs?.transmission ? msg(`drive.f.opt.transmission.${vehicle.specs.transmission}`) : null)) },
              { label: msg("drive.sc.r.equipment"), cells: vehicles.map(featureCell) },
            ]
          : []),
      ]
      const luggage = compareNumber(vehicles, (vehicle) => vehicle.luggage, "drive.sc.i.luggage")
      const seats = compareNumber(vehicles, (vehicle) => vehicle.seats, "drive.sc.i.seats")
      if (luggage) insights.push(luggage)
      if (seats) insights.push(seats)
      if (topic === "features") {
        const categories = new Set(vehicles.map(targetCategory))
        insights.push(categories.size === 1 ? msg("drive.sc.i.categorySame") : msg("drive.sc.i.categoryDiff"))
      }
      if (topic === "capacity") insights.push(msg("drive.sc.i.luggageRef"))
      break
    }
    case "fuel": {
      rows = [
        { label: msg("drive.sc.r.fuel"), cells: vehicles.map((vehicle) => (vehicle.specs?.fuel ? msg(`drive.f.opt.fuel.${vehicle.specs.fuel}`) : null)) },
        { label: msg("drive.sc.r.consumption"), cells: vehicles.map(() => null) },
      ]
      break
    }
    case "transmission": {
      rows = [{ label: msg("drive.sc.r.transmission"), cells: vehicles.map((vehicle) => (vehicle.specs?.transmission ? msg(`drive.f.opt.transmission.${vehicle.specs.transmission}`) : null)) }]
      const known = new Set(vehicles.map((vehicle) => vehicle.specs?.transmission).filter(Boolean))
      if (known.size === 1 && vehicles.every((vehicle) => vehicle.specs?.transmission)) insights.push(msg("drive.sc.i.transmissionSame", { value: `$t(drive.f.opt.transmission.${[...known][0]})` }))
      break
    }
    case "mileage": {
      rows = [
        {
          label: msg("drive.sc.r.mileage"),
          cells: vehicles.map((vehicle) => {
            const mileage = offer(vehicle)?.mileage
            if (mileage?.kind === "limited") {
              return msg(typeof mileage.extraKmFcfa === "number" ? "drive.sc.v.limitedExtra" : "drive.sc.v.limited", {
                km: mileage.includedKmPerDay,
                extra: typeof mileage.extraKmFcfa === "number" ? money(mileage.extraKmFcfa) : "",
              })
            }
            if (mileage?.kind === "unlimited" && mileage.rule.trim()) return msg("drive.sc.v.unlimited", { rule: mileage.rule })
            return textCell(vehicle.facts?.mileagePolicy)
          }),
        },
      ]
      break
    }
    case "pickup": {
      rows = [
        {
          label: msg("drive.sc.r.pickup"),
          cells: vehicles.map((vehicle) => {
            const modes = offer(vehicle)?.pickupModes
            return modes && modes.length > 0 ? msg("drive.sc.v.list", { items: modes.map((mode) => `$t(drive.f.opt.pickupmode.${mode})`).join(", ") }) : null
          }),
        },
        {
          label: msg("drive.sc.r.payment"),
          cells: vehicles.map((vehicle) => {
            const timings = offer(vehicle)?.paymentTimings
            return timings && timings.length > 0 ? msg("drive.sc.v.list", { items: timings.map((item) => `$t(drive.f.opt.payment.${item})`).join(", ") }) : null
          }),
        },
      ]
      if (context.criteria?.pickup) insights.push(msg("drive.sc.i.pickupPlace", { place: context.criteria.pickup }))
      break
    }
    case "insurance": {
      rows = [
        {
          label: msg("drive.sc.r.insurance"),
          cells: vehicles.map((vehicle) => {
            const insurance = offer(vehicle)?.insurance
            if (insurance) return raw(insurance.coverage)
            return textCell(vehicle.facts?.insurance)
          }),
        },
        {
          label: msg("drive.sc.r.excess"),
          cells: vehicles.map((vehicle) => {
            const excess = offer(vehicle)?.insurance?.excessFcfa
            return typeof excess === "number" ? msg("drive.sc.v.amount", { amount: money(excess) }) : null
          }),
        },
      ]
      insights.push(msg("drive.sc.i.insuranceRule"))
      break
    }
    case "deposit": {
      rows = [
        {
          label: msg("drive.sc.r.deposit"),
          cells: vehicles.map((vehicle) => {
            const deposit = offer(vehicle)?.depositFcfa
            return typeof deposit === "number" ? msg("drive.sc.v.amount", { amount: money(deposit) }) : textCell(vehicle.facts?.deposit)
          }),
        },
      ]
      break
    }
    case "fuelpolicy": {
      rows = [
        {
          label: msg("drive.sc.r.fuelpolicy"),
          cells: vehicles.map((vehicle) => {
            const policy = offer(vehicle)?.fuelPolicy
            if (!policy) return null
            return policy.details ? msg("drive.sc.v.withDetails", { value: `$t(drive.f.opt.fuelpolicy.${policy.kind})`, details: policy.details }) : msg(`drive.f.opt.fuelpolicy.${policy.kind}`)
          }),
        },
      ]
      break
    }
    case "cancellation": {
      rows = [{ label: msg("drive.sc.r.cancellation"), cells: vehicles.map((vehicle) => textCell(offer(vehicle)?.cancellation ?? vehicle.facts?.cancellation)) }]
      break
    }
    case "extras": {
      rows = [
        {
          label: msg("drive.sc.r.extras"),
          cells: vehicles.map((vehicle) => {
            const extras = offer(vehicle)?.extras?.filter((extra) => extra.onQuote || typeof extra.priceFcfa === "number")
            if (!extras || extras.length === 0) return null
            const items = extras.map((extra) => {
              const name = extra.label ?? `$t(drive.f.opt.extras.${extra.id})`
              return extra.onQuote ? `${name} ($t(drive.sc.v.onQuote))` : `${name} (${money(extra.priceFcfa!)})`
            })
            return msg("drive.sc.v.list", { items: items.join(", ") })
          }),
        },
        { label: msg("drive.sc.r.equipment"), cells: vehicles.map(featureCell) },
      ]
      break
    }
    case "providers": {
      rows = [
        {
          label: msg("drive.sc.r.provider"),
          cells: vehicles.map((vehicle) => {
            const partner = context.partners.find((item) => item.id === (vehicle.partnerId ?? "yamoo"))
            return partner ? msg("drive.sc.v.provider", { name: partner.name, city: partner.city }) : null
          }),
        },
        {
          label: msg("drive.sc.r.providerStatus"),
          cells: vehicles.map((vehicle) => {
            const partner = context.partners.find((item) => item.id === (vehicle.partnerId ?? "yamoo"))
            if (!partner) return null
            return msg(partner.verificationStatus === "confirmed" ? "drive.sc.v.confirmed" : "drive.sc.v.demoPartner")
          }),
        },
      ]
      const ids = new Set(vehicles.map((vehicle) => vehicle.partnerId ?? "yamoo"))
      insights.push(ids.size === 1 ? msg("drive.sc.i.providerSame") : msg("drive.sc.i.providerDiff", { count: ids.size }))
      break
    }
    case "reviews": {
      rows = [
        {
          label: msg("drive.sc.r.reviews"),
          cells: vehicles.map((vehicle) =>
            vehicle.rating?.verified && vehicle.rating.count > 0 ? msg("drive.sc.v.rating", { score: vehicle.rating.score10, count: vehicle.rating.count }) : null,
          ),
        },
      ]
      break
    }
  }

  return { topic, rows, insights: [...insights, ...missingInsights(rows, vehicles)] }
}

export const deterministicAssistant: CompareAssistant = {
  kind: "deterministic",
  answer: (topic, vehicles, context) => build(topic, vehicles, context),
}

export type ComparePriority = "price" | "comfort" | "capacity"

export type ComparePrefs = {
  travellers: number | null
  bags: number | null
  budgetFcfa: number | null
  days: number | null
  transmission: "" | "automatic" | "manual"
  priority: ComparePriority
}

export type CheckStatus = "ok" | "ko" | "unknown"

export type Recommendation = {
  checks: Array<{ vehicle: DriveVehicle; cost: number | null; items: Array<{ label: Msg; status: CheckStatus }>; score: number }>
  winners: DriveVehicle[]
  reasons: Msg[]
}

/** Cost for a duration with the configured daily rule (rate × days). */
function costFor(vehicle: DriveVehicle, days: number): number {
  const start = new Date(2026, 0, 1, 10)
  const end = new Date(2026, 0, days, 10)
  return calculateDrivePrice({ service: "chauffeur_daily", vehicle, startAt: start, endAt: end }).priceFcfa
}

/** Explainable recommendation: each criterion is a visible check; ties use the stated priority. */
export function recommend(vehicles: readonly DriveVehicle[], prefs: ComparePrefs, context: CompareContext): Recommendation {
  const money = (amount: number) => formatFcfa(amount, context.locale)
  const days = prefs.days ?? (context.criteria?.service === "chauffeur_daily" ? vehicleQuote(context.criteria, vehicles[0]).days : null)
  const checks = vehicles.map((vehicle) => {
    const cost = days ? costFor(vehicle, days) : null
    const items: Array<{ label: Msg; status: CheckStatus }> = []
    if (prefs.travellers !== null) items.push({ label: msg("drive.sc.chk.seats", { need: prefs.travellers, has: vehicle.seats }), status: vehicle.seats >= prefs.travellers ? "ok" : "ko" })
    if (prefs.bags !== null) items.push({ label: msg("drive.sc.chk.bags", { need: prefs.bags, has: vehicle.luggage }), status: vehicle.luggage >= prefs.bags ? "ok" : "ko" })
    if (prefs.transmission) {
      const known = vehicle.specs?.transmission
      items.push({
        label: msg("drive.sc.chk.transmission", { need: `$t(drive.f.opt.transmission.${prefs.transmission})` }),
        status: !known ? "unknown" : known === prefs.transmission ? "ok" : "ko",
      })
    }
    if (prefs.budgetFcfa !== null) {
      items.push({
        label: cost === null ? msg("drive.sc.chk.budgetNoDays") : msg("drive.sc.chk.budget", { cost: money(cost), budget: money(prefs.budgetFcfa) }),
        status: cost === null ? "unknown" : cost <= prefs.budgetFcfa ? "ok" : "ko",
      })
    }
    return { vehicle, cost, items, score: items.filter((item) => item.status === "ok").length }
  })

  const reasons: Msg[] = []
  const best = Math.max(...checks.map((check) => check.score))
  let pool = checks.filter((check) => check.score === best)
  if (checks.some((check) => check.items.length > 0)) {
    reasons.push(msg("drive.sc.rec.score", { best, total: checks[0].items.length }))
  }
  if (pool.length > 1) {
    const priority = prefs.priority
    if (priority === "comfort") reasons.push(msg("drive.sc.rec.comfortNoData"))
    if (priority === "price" && pool.every((check) => check.cost !== null)) {
      const min = Math.min(...pool.map((check) => check.cost!))
      pool = pool.filter((check) => check.cost === min)
      reasons.push(msg("drive.sc.rec.byPrice"))
    } else {
      if (priority === "price") reasons.push(msg("drive.sc.rec.priceNoDays"))
      const capacity = (check: (typeof checks)[number]) => check.vehicle.luggage * 100 + check.vehicle.seats
      const max = Math.max(...pool.map(capacity))
      pool = pool.filter((check) => capacity(check) === max)
      reasons.push(msg("drive.sc.rec.byCapacity"))
    }
  }
  if (pool.length > 1) reasons.push(msg("drive.sc.rec.tie"))
  return { checks, winners: pool.map((check) => check.vehicle), reasons }
}

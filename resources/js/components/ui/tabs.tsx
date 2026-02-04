import * as React from "react"

import { cn } from "@/lib/utils"

type TabsContextValue = {
  value: string
  setValue: (next: string) => void
}

const TabsContext = React.createContext<TabsContextValue | null>(null)

type TabsProps = {
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
  className?: string
  children: React.ReactNode
}

function Tabs({ defaultValue, value, onValueChange, className, children }: TabsProps) {
  const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue ?? "")
  const isControlled = value !== undefined

  const currentValue = isControlled ? value : uncontrolledValue

  const setValue = React.useCallback(
    (next: string) => {
      if (!isControlled) setUncontrolledValue(next)
      onValueChange?.(next)
    },
    [isControlled, onValueChange]
  )

  return (
    <TabsContext.Provider value={{ value: currentValue, setValue }}>
      <div data-slot="tabs" className={cn("w-full", className)}>
        {children}
      </div>
    </TabsContext.Provider>
  )
}

function TabsList({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="tabs-list"
      className={cn(
        "bg-muted text-muted-foreground inline-flex h-10 items-center justify-center rounded-lg ",
        className
      )}
      {...props}
    />
  )
}

type TabsTriggerProps = React.ComponentProps<"button"> & {
  value: string
}

function TabsTrigger({ className, value, type, onClick, ...props }: TabsTriggerProps) {
  const ctx = React.useContext(TabsContext)
  if (!ctx) throw new Error("TabsTrigger must be used within <Tabs>")

  const isActive = ctx.value === value

  return (
    <button
      data-slot="tabs-trigger"
      data-state={isActive ? "active" : "inactive"}
      type={type ?? "button"}
      className={cn(
        "data-[state=active]:bg-[color:var(--brand-primary)] data-[state=active]:text-white data-[state=active]:shadow-xs focus-visible:border-ring focus-visible:ring-ring/50 inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 h-full text-sm font-medium transition-[color,box-shadow] outline-none  focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
        className
      )}
      onClick={(e) => {
        ctx.setValue(value)
        onClick?.(e)
      }}
      {...props}
    />
  )
}

type TabsContentProps = React.ComponentProps<"div"> & {
  value: string
}

function TabsContent({ className, value, ...props }: TabsContentProps) {
  const ctx = React.useContext(TabsContext)
  if (!ctx) throw new Error("TabsContent must be used within <Tabs>")

  if (ctx.value !== value) return null

  return <div data-slot="tabs-content" className={cn("mt-4", className)} {...props} />
}

export { Tabs, TabsContent, TabsList, TabsTrigger }

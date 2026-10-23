import * as React from "react"
import { Check, ChevronsUpDown, X } from "lucide-react"

import { cn } from "../lib/utils"
import { Button } from "./button"
import { Badge } from "./badge"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "./command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "./popover"

interface MultiComboboxProps {
    options: { value: string; label: string }[]
    values: string[]
    onChange: (values: string[]) => void
    placeholder?: string
    searchPlaceholder?: string
    emptyMessage?: string
    className?: string
    disabled?: boolean
}

/** Same look/feel as Combobox, but keeps the popover open across picks and
 * tracks an array of values instead of one — for many-to-one fields like
 * sso_program_access. */
export function MultiCombobox({
    options,
    values,
    onChange,
    placeholder = "Select options...",
    searchPlaceholder = "Search...",
    emptyMessage = "No option found.",
    className,
    disabled = false,
}: MultiComboboxProps) {
    const [open, setOpen] = React.useState(false)

    const toggle = (value: string) => {
        onChange(
            values.includes(value)
                ? values.filter((v) => v !== value)
                : [...values, value]
        )
    }

    const selectedLabels = options.filter((o) => values.includes(o.value))

    // modal=true: this Popover stays open across multiple picks (unlike the
    // single-select Combobox, which closes itself on every select), and it's
    // nested inside a modal Dialog. Without `modal` here the two overlays
    // fight over Radix's body pointer-events/focus-trap bookkeeping and can
    // leave the Dialog's own buttons (e.g. Update) unclickable after this
    // popover closes.
    return (
        <Popover open={open} onOpenChange={setOpen} modal>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn("w-full justify-between h-auto min-h-10 font-normal", className)}
                    disabled={disabled}
                >
                    <div className="flex flex-wrap gap-1 flex-1 text-left">
                        {selectedLabels.length === 0 && (
                            <span className="text-muted-foreground">{placeholder}</span>
                        )}
                        {selectedLabels.map((option) => (
                            <Badge
                                key={option.value}
                                variant="secondary"
                                className="flex items-center gap-1"
                            >
                                {option.label}
                                <span
                                    role="button"
                                    tabIndex={-1}
                                    className="cursor-pointer"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        toggle(option.value)
                                    }}
                                >
                                    <X className="h-3 w-3" />
                                </span>
                            </Badge>
                        ))}
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
                <Command>
                    <CommandInput placeholder={searchPlaceholder} />
                    <CommandList>
                        <CommandEmpty>{emptyMessage}</CommandEmpty>
                        <CommandGroup>
                            {options.map((option) => (
                                <CommandItem
                                    key={option.value}
                                    value={option.label}
                                    onSelect={() => toggle(option.value)}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            values.includes(option.value) ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {option.label}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}

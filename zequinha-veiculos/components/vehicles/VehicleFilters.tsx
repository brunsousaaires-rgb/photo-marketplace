"use client";

import { cn } from "@/lib/utils";
import { VehicleCategory, vehicleCategoryLabels } from "@/data/vehicles";

export type FilterValue = VehicleCategory | "todos";

const filters: { value: FilterValue; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "picape", label: vehicleCategoryLabels.picape },
  { value: "suv", label: vehicleCategoryLabels.suv },
  { value: "sedan", label: vehicleCategoryLabels.sedan },
  { value: "hatch", label: vehicleCategoryLabels.hatch },
  { value: "utilitario", label: vehicleCategoryLabels.utilitario },
];

export function VehicleFilters({
  active,
  onChange,
}: {
  active: FilterValue;
  onChange: (value: FilterValue) => void;
}) {
  return (
    <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
      {filters.map((f) => (
        <button
          key={f.value}
          onClick={() => onChange(f.value)}
          data-cursor="link"
          className={cn(
            "shrink-0 rounded-full border px-5 py-2.5 text-[12px] font-medium uppercase tracking-wide transition-colors",
            active === f.value
              ? "border-turquoise-400 bg-turquoise-500/10 text-turquoise-300"
              : "border-white/12 text-white/55 hover:border-white/30 hover:text-white"
          )}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}

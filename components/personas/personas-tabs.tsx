import Link from "next/link";

interface PersonasTabsProps {
  activeTab: string;
  children: React.ReactNode;
}

export function PersonasTabs({ activeTab, children }: PersonasTabsProps) {
  const tabs = [
    { value: "descubrir", label: "Descubrir" },
    { value: "conexiones", label: "Conexiones" },
    { value: "pendientes", label: "Pendientes" },
  ];

  return (
    <div className="container mx-auto max-w-6xl px-4 py-6 sm:py-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Personas</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          Descubre asistentes y gestiona tus conexiones
        </p>
      </div>

      <div className="mb-6">
        <div className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground w-full">
          {tabs.map((tab) => (
            <Link
              key={tab.value}
              href={`/personas?tab=${tab.value}`}
              className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-xs sm:text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 flex-1 ${
                activeTab === tab.value
                  ? "bg-background text-foreground shadow-sm"
                  : "hover:bg-background/50"
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-6">{children}</div>
    </div>
  );
}

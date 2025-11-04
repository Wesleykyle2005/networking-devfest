import Image from "next/image";

interface SentPageProps {
  searchParams: Promise<{
    email?: string;
  }>;
}

export default async function InvitationSentPage({ searchParams }: SentPageProps) {
  const { email } = await searchParams;

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-gradient-to-b from-background to-muted px-4 py-12">
      <div className="flex flex-col items-center gap-6 text-center max-w-2xl">
        <div className="flex justify-center mb-2">
          <Image
            src="/assets/devfest-logo.svg"
            alt="DevFest"
            width={200}
            height={40}
            className="h-10 w-auto"
            priority
          />
        </div>
        
        <div className="space-y-2">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
            <span className="text-3xl">📧</span>
          </div>
          <p className="text-sm uppercase tracking-widest text-muted-foreground">
            Enlace enviado
          </p>
          <h1 className="text-3xl font-bold sm:text-4xl">
            ¡Revisa tu correo!
          </h1>
          <p className="max-w-xl text-muted-foreground">
            Te hemos enviado un enlace mágico a{" "}
            <strong className="text-foreground">{email || "tu correo"}</strong>
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            Haz clic en el enlace del correo para completar tu registro y
            acceder a la app.
          </p>
        </div>

        <div className="w-full max-w-sm rounded-lg bg-muted/50 border p-4">
          <p className="text-sm text-muted-foreground">
            💡 <strong className="text-foreground">Consejo:</strong> Si no ves el correo, revisa tu carpeta
            de spam o correo no deseado.
          </p>
        </div>

        <div className="border-t pt-4 w-full max-w-sm">
          <p className="text-center text-sm text-muted-foreground">
            <a
              href="/login"
              className="font-semibold text-primary hover:underline"
            >
              Volver al inicio
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

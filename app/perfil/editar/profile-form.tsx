"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Upload, X } from "lucide-react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LocationInput } from "@/components/ui/location-input";
import { PhoneInput } from "@/components/ui/phone-input";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import {
  profileFormSchema,
  type ProfileFormValues,
} from "@/lib/validators/profile";

import { saveProfile } from "./actions";

const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3MB
const AVATAR_EXPORT_SIZE = 600;

const SOCIAL_PREFIXES = {
  linkedin: [
    "https://www.linkedin.com/in/",
    "https://linkedin.com/in/",
    "www.linkedin.com/in/",
    "linkedin.com/in/",
    "https://www.linkedin.com/",
    "https://linkedin.com/",
    "www.linkedin.com/",
    "linkedin.com/",
  ],
  twitter: [
    "https://twitter.com/",
    "https://www.twitter.com/",
    "twitter.com/",
    "www.twitter.com/",
    "https://x.com/",
    "https://www.x.com/",
    "x.com/",
    "www.x.com/",
  ],
  instagram: [
    "https://instagram.com/",
    "https://www.instagram.com/",
    "instagram.com/",
    "www.instagram.com/",
  ],
  facebook: [
    "https://facebook.com/",
    "https://www.facebook.com/",
    "facebook.com/",
    "www.facebook.com/",
  ],
} as const;

const SOCIAL_DISPLAY_PREFIX = {
  linkedin: "linkedin.com/in/",
  twitter: "x.com/",
  instagram: "instagram.com/",
  facebook: "facebook.com/",
} as const;

function stripSocialHandle(
  url: string | null | undefined,
  type: keyof typeof SOCIAL_PREFIXES,
): string {
  if (!url) return "";
  let value = url.trim();
  if (!value) return "";

  if (value.startsWith("http://") || value.startsWith("https://")) {
    try {
      const parsed = new URL(value);
      value = `${parsed.hostname}${parsed.pathname}`;
    } catch {
      // ignore parse errors; fall back to original value
    }
  }

  value = value.replace(/^https?:\/\//, "");

  for (const prefix of SOCIAL_PREFIXES[type]) {
    if (value.toLowerCase().startsWith(prefix.toLowerCase())) {
      value = value.slice(prefix.length);
      break;
    }
  }

  value = value.replace(/^@/, "").replace(/^\/+/, "");
  value = value.replace(/\/+$/, "");

  return value;
}

interface ProfileFormProps {
  initialValues: ProfileFormValues;
  slug: string;
  userId: string;
}

export function ProfileForm({ initialValues, slug, userId }: ProfileFormProps) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    initialValues.avatar_url || null,
  );
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);

  const normalizedDefaults = useMemo(
    () => ({
      ...initialValues,
      social_linkedin: stripSocialHandle(initialValues.social_linkedin, "linkedin"),
      social_twitter: stripSocialHandle(initialValues.social_twitter, "twitter"),
      social_instagram: stripSocialHandle(initialValues.social_instagram, "instagram"),
      social_facebook: stripSocialHandle(initialValues.social_facebook, "facebook"),
    }),
    [initialValues],
  );

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: normalizedDefaults,
    mode: "onBlur",
  });

  useEffect(() => {
    form.reset(normalizedDefaults);
  }, [form, normalizedDefaults]);

  useEffect(() => {
    setAvatarPreview(initialValues.avatar_url || null);
  }, [initialValues.avatar_url]);

  useEffect(() => {
    return () => {
      if (avatarPreview && avatarPreview.startsWith("blob:")) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  const handleAvatarRemove = () => {
    setAvatarFile(null);
    if (avatarPreview && avatarPreview.startsWith("blob:")) {
      URL.revokeObjectURL(avatarPreview);
    }
    setAvatarPreview(null);
    form.setValue("avatar_url", "", { shouldDirty: true });
  };

  const handleAvatarChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      setErrorMessage("La imagen supera los 3MB permitidos");
      return;
    }

    try {
      const { processedFile, dataUrl } = await cropImageToSquare(file);
      setAvatarFile(processedFile);
      setAvatarPreview(dataUrl);
      form.setValue("avatar_url", dataUrl, { shouldDirty: true });
      setErrorMessage(null);
    } catch (error) {
      console.error("Error al procesar avatar", error);
      setErrorMessage(
        "No pudimos procesar la imagen. Prueba con un archivo PNG o JPG diferente.",
      );
    }
  };

  const onSubmit = form.handleSubmit(async (values) => {
    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      let avatarUrl = values.avatar_url || initialValues.avatar_url || "";

      if (avatarFile) {
        const path = `avatars/${userId}/avatar-${Date.now()}.png`;
        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(path, avatarFile, {
            cacheControl: "3600",
            upsert: true,
            contentType: avatarFile.type,
          });

        if (uploadError) {
          throw new Error(
            "No pudimos subir la imagen. Verifica tu conexión y vuelve a intentar.",
          );
        }

        const { data: publicData } = supabase.storage.from("avatars").getPublicUrl(path);

        if (!publicData?.publicUrl) {
          throw new Error(
            "No pudimos generar la URL pública del avatar. Intenta más tarde.",
          );
        }

        avatarUrl = publicData.publicUrl;
      }

      const result = await saveProfile({ ...values, avatar_url: avatarUrl });

      if (!result.success) {
        if (result.fieldErrors) {
          Object.entries(result.fieldErrors).forEach(([field, messages]) => {
            if (messages && messages.length > 0) {
              form.setError(field as keyof ProfileFormValues, {
                message: messages[0],
              });
            }
          });
        }
        const errorMsg = result.error ?? "No pudimos guardar los cambios. Intenta nuevamente.";
        setErrorMessage(errorMsg);
        setShowErrorModal(true);
        return;
      }

      setSuccessMessage("Perfil actualizado correctamente.");
      setAvatarFile(null);
      setAvatarPreview(avatarUrl || null);
      form.setValue("avatar_url", avatarUrl, { shouldDirty: false });

      // Show success modal and redirect after 1 second
      setShowSuccessModal(true);
      setTimeout(() => {
        router.refresh();
        if (result.slug) {
          router.push(`/perfil/${result.slug}`);
        }
      }, 1000);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Ocurrió un error inesperado. Intenta nuevamente.";
      setErrorMessage(message);
      setShowErrorModal(true);
    } finally {
      setIsSaving(false);
    }
  });

  return (
    <div className="space-y-6">
      <Card className="border-none shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold">Avatar</CardTitle>
          <p className="text-sm text-muted-foreground">
            Sube una imagen cuadrada (PNG o JPG, máximo 3MB)
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-xl border bg-muted">
            {avatarPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarPreview}
                alt="Vista previa del avatar"
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-xs text-muted-foreground">
                1:1
              </span>
            )}
          </div>
          <div className="flex flex-1 flex-col gap-3">
            <div className="flex flex-wrap gap-3">
              <Label className="inline-flex cursor-pointer items-center gap-2 rounded-md border bg-background px-4 py-2 text-sm font-medium shadow-sm transition hover:bg-muted">
                <Upload className="h-4 w-4" />
                Cambiar avatar
                <input
                  type="file"
                  accept="image/png,image/jpeg"
                  className="sr-only"
                  onChange={handleAvatarChange}
                />
              </Label>
              {avatarPreview && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleAvatarRemove}
                  className="inline-flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Quitar avatar
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <form className="space-y-6" onSubmit={onSubmit}>
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold">Información principal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormRow>
              <FormField label="Nombre" error={form.formState.errors.name?.message}>
                <Input placeholder="Tu nombre completo" {...form.register("name")} />
              </FormField>
              <FormField
                label="Titular profesional"
                error={form.formState.errors.headline?.message}
              >
                <Input
                  placeholder="Ej. Desarrollador móvil en GDG"
                  {...form.register("headline")}
                />
              </FormField>
            </FormRow>
            <FormRow>
              <FormField label="Empresa" error={form.formState.errors.company?.message}>
                <Input placeholder="Nombre de la empresa" {...form.register("company")} />
              </FormField>
              <FormField
                label="Cargo"
                hint="Opcional, ayuda al directorio"
                error={form.formState.errors.job_title?.message}
              >
                <Input placeholder="Tu rol actual" {...form.register("job_title")} />
              </FormField>
            </FormRow>
            <FormField
              label="Bio corta"
              hint="Máximo 400 caracteres"
              error={form.formState.errors.bio?.message}
            >
              <Textarea
                rows={4}
                placeholder="Cuenta en pocas líneas cómo puedes ayudar o qué buscas en el evento"
                {...form.register("bio")}
              />
            </FormField>
            <FormField
              label="Ubicación"
              error={form.formState.errors.location?.message}
            >
              <LocationInput
                value={form.watch("location")}
                onChange={(value) => form.setValue("location", value, { shouldDirty: true })}
                placeholder="Managua, Nicaragua"
              />
            </FormField>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold">Redes y contacto</CardTitle>
            <p className="text-sm text-muted-foreground">
              Agrega tus redes sociales para facilitar el contacto
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormRow>
              <FormField
                label="LinkedIn"
                error={form.formState.errors.social_linkedin?.message}
              >
                <div className="flex">
                  <span className="inline-flex items-center rounded-l-md border border-input bg-muted px-3 text-sm text-muted-foreground">
                    {SOCIAL_DISPLAY_PREFIX.linkedin}
                  </span>
                  <Input
                    placeholder="tu-usuario"
                    className="rounded-l-none"
                    {...form.register("social_linkedin")}
                  />
                </div>
              </FormField>
              <FormField
                label="X / Twitter"
                error={form.formState.errors.social_twitter?.message}
              >
                <div className="flex">
                  <span className="inline-flex items-center rounded-l-md border border-input bg-muted px-3 text-sm text-muted-foreground">
                    {SOCIAL_DISPLAY_PREFIX.twitter}
                  </span>
                  <Input
                    placeholder="usuario"
                    className="rounded-l-none"
                    {...form.register("social_twitter")}
                  />
                </div>
              </FormField>
            </FormRow>
            <FormRow>
              <FormField
                label="Instagram"
                error={form.formState.errors.social_instagram?.message}
              >
                <div className="flex">
                  <span className="inline-flex items-center rounded-l-md border border-input bg-muted px-3 text-sm text-muted-foreground">
                    {SOCIAL_DISPLAY_PREFIX.instagram}
                  </span>
                  <Input
                    placeholder="usuario"
                    className="rounded-l-none"
                    {...form.register("social_instagram")}
                  />
                </div>
              </FormField>
              <FormField
                label="Facebook"
                error={form.formState.errors.social_facebook?.message}
              >
                <div className="flex">
                  <span className="inline-flex items-center rounded-l-md border border-input bg-muted px-3 text-sm text-muted-foreground">
                    {SOCIAL_DISPLAY_PREFIX.facebook}
                  </span>
                  <Input
                    placeholder="usuario"
                    className="rounded-l-none"
                    {...form.register("social_facebook")}
                  />
                </div>
              </FormField>
            </FormRow>
            <FormRow>
              <FormField
                label="Teléfono"
                error={form.formState.errors.phone?.message}
              >
                <PhoneInput
                  value={form.watch("phone")}
                  onChange={(value) => form.setValue("phone", value || "", { shouldDirty: true })}
                  placeholder="Ingresa tu número"
                />
              </FormField>
              <FormField
                label="Correo público"
                error={form.formState.errors.email_public?.message}
              >
                <Input placeholder="contacto@empresa.com" {...form.register("email_public")} />
              </FormField>
            </FormRow>
            <FormField
              label="Sitio web"
              error={form.formState.errors.website?.message}
            >
              <Input placeholder="https://miportfolio.dev" {...form.register("website")} />
            </FormField>
            <div className="space-y-3 rounded-lg border border-dashed p-4 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium">Privacidad de contacto</p>
                <p className="text-sm text-muted-foreground">
                  Oculta tus datos hasta que alguien forme parte de tus conexiones.
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={form.watch("hide_phone_until_connected")}
                    onCheckedChange={(checked) =>
                      form.setValue(
                        "hide_phone_until_connected",
                        Boolean(checked),
                        { shouldDirty: true },
                      )
                    }
                  />
                  Ocultar teléfono
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={form.watch("hide_email_until_connected")}
                    onCheckedChange={(checked) =>
                      form.setValue(
                        "hide_email_until_connected",
                        Boolean(checked),
                        { shouldDirty: true },
                      )
                    }
                  />
                  Ocultar correo
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4 rounded-lg border border-border/60 bg-muted/30 p-6">
          {errorMessage && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {errorMessage}
            </div>
          )}
          {successMessage && (
            <div className="rounded-md bg-green-500/10 p-3 text-sm text-green-600">
              {successMessage}
            </div>
          )}

          <div className="flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.push(`/perfil/${slug}`)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving} size="lg">
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar cambios
            </Button>
          </div>
        </div>
      </form>

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">✓ Perfil actualizado</DialogTitle>
            <DialogDescription className="text-center">
              Tus cambios se guardaron correctamente. Redirigiendo a tu perfil...
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      {/* Error Modal */}
      <Dialog open={showErrorModal} onOpenChange={setShowErrorModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Error al guardar</DialogTitle>
            <DialogDescription className="text-center">
              {errorMessage || "No pudimos guardar los cambios. Intenta nuevamente."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center">
            <Button onClick={() => setShowErrorModal(false)}>
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface FormFieldProps {
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}

function FormField({ label, error, hint, children }: FormFieldProps) {
  return (
    <div className="flex w-full flex-col gap-2">
      <Label className="text-sm font-medium">
        {label}
        {hint && <span className="ml-2 text-xs font-normal text-muted-foreground">{hint}</span>}
      </Label>
      {children}
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}

interface FormRowProps {
  children: ReactNode;
}

function FormRow({ children }: FormRowProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row">
      {children}
    </div>
  );
}

async function cropImageToSquare(file: File) {
  const image = await loadImage(file);
  const size = Math.min(image.width, image.height);
  const canvas = document.createElement("canvas");
  canvas.width = AVATAR_EXPORT_SIZE;
  canvas.height = AVATAR_EXPORT_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("No se pudo crear el contexto de la imagen");
  }

  const offsetX = (image.width - size) / 2;
  const offsetY = (image.height - size) / 2;
  ctx.drawImage(
    image,
    offsetX,
    offsetY,
    size,
    size,
    0,
    0,
    AVATAR_EXPORT_SIZE,
    AVATAR_EXPORT_SIZE,
  );

  const dataUrl = canvas.toDataURL("image/png", 0.9);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((createdBlob) => resolve(createdBlob), "image/png", 0.9),
  );

  if (!blob) {
    throw new Error("No pudimos generar la imagen recortada");
  }

  const processedFile = new File([blob], `avatar-${Date.now()}.png`, {
    type: "image/png",
  });

  return { processedFile, dataUrl };
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(file);
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = (error) => {
      URL.revokeObjectURL(url);
      reject(error);
    };
    image.src = url;
  });
}

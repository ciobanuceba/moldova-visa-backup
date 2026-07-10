import { useI18n, type Locale } from "@/lib/i18n";

export function LanguageToggle({ className = "" }: { className?: string }) {
  const { locale, setLocale } = useI18n();

  const toggle = () => {
    setLocale(locale === "en" ? "bn" : "en");
  };

  return (
    <button
      onClick={toggle}
      className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-full border border-border hover:border-secondary hover:text-secondary transition-colors ${className}`}
      aria-label="Switch language"
    >
      {locale === "en" ? (
        <>
          <span>EN</span>
          <span className="text-muted-foreground">|</span>
          <span className="text-muted-foreground">বাং</span>
        </>
      ) : (
        <>
          <span className="text-muted-foreground">EN</span>
          <span className="text-muted-foreground">|</span>
          <span>বাং</span>
        </>
      )}
    </button>
  );
}

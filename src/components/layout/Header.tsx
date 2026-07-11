import { getServerSession } from "next-auth";
import { authOptions } from "@/modules/auth/auth";
import { getDictionary, Locale } from "@/i18n/dictionaries";
import { NavbarClient } from "./NavbarClient";

export async function Header({ lang }: { lang: string }) {
  const session = await getServerSession(authOptions);
  const dict = await getDictionary(lang as Locale);

  return <NavbarClient lang={lang} session={session} dict={dict.header} />;
}
